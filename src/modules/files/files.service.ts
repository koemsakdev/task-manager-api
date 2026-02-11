import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import * as path from "path";
import { File } from "./entities/file.entity";
import { ProjectsService } from "../projects/projects.service";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import {
  PaginationDto,
  PaginatedResponseDto,
} from "../../common/dto/pagination.dto";
import { ActivityAction, EntityType } from "../../common/constants";

@Injectable()
export class FilesService {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    private projectsService: ProjectsService,
    private activityLogsService: ActivityLogsService,
    private configService: ConfigService,
  ) {
    this.region = this.configService.get("AWS_REGION", "ap-southeast-1");
    this.bucketName = this.configService.get(
      "AWS_S3_BUCKET",
      "task-manager-files",
    );

    // Initialize S3 Client
    // For AWS S3:
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get("AWS_ACCESS_KEY_ID"),
        secretAccessKey: this.configService.get("AWS_SECRET_ACCESS_KEY"),
      },
    });

    // For Supabase Storage (uncomment below and comment above):
    // this.s3Client = new S3Client({
    //   region: this.region,
    //   endpoint: this.configService.get("SUPABASE_STORAGE_URL"), // e.g., https://xxx.supabase.co/storage/v1/s3
    //   credentials: {
    //     accessKeyId: this.configService.get("SUPABASE_SERVICE_KEY"),
    //     secretAccessKey: this.configService.get("SUPABASE_SERVICE_KEY"),
    //   },
    //   forcePathStyle: true, // Required for Supabase
    // });
  }

  /**
   * Upload file to S3
   */
  async upload(
    projectId: string,
    userId: string,
    file: Express.Multer.File,
    taskId?: string,
  ): Promise<File> {
    // Check permission
    const canUpload = await this.projectsService.hasPermission(
      projectId,
      userId,
      "file",
      "upload",
    );
    if (!canUpload) {
      throw new ForbiddenException(
        "You do not have permission to upload files",
      );
    }

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    const s3Key = `projects/${projectId}/${uniqueName}`;

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        originalName: file.originalname,
        uploadedBy: userId,
        projectId: projectId,
        ...(taskId && { taskId }),
      },
    });

    await this.s3Client.send(uploadCommand);

    // Generate public URL
    const fileUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${s3Key}`;

    // Save to database
    const fileEntity = this.fileRepository.create({
      projectId,
      taskId: taskId || null,
      uploadedById: userId,
      fileName: file.originalname,
      fileUrl: fileUrl,
      fileSize: file.size,
      mimeType: file.mimetype,
    });

    await this.fileRepository.save(fileEntity);

    // Log activity
    await this.activityLogsService.log({
      projectId,
      userId,
      action: ActivityAction.UPLOADED,
      entityType: EntityType.FILE,
      entityId: fileEntity.id,
      details: { fileName: file.originalname, taskId },
    });

    return this.findOne(fileEntity.id, userId);
  }

  /**
   * Get all files for a project
   */
  async findAll(
    projectId: string,
    userId: string,
    pagination: PaginationDto,
    taskId?: string,
  ): Promise<PaginatedResponseDto<File>> {
    await this.projectsService.findOne(projectId, userId);

    const queryBuilder = this.fileRepository
      .createQueryBuilder("file")
      .leftJoinAndSelect("file.uploadedBy", "uploader")
      .where("file.projectId = :projectId", { projectId });

    if (taskId) {
      queryBuilder.andWhere("file.taskId = :taskId", { taskId });
    }

    queryBuilder
      .select([
        "file",
        "uploader.id",
        "uploader.fullName",
        "uploader.avatarUrl",
      ])
      .orderBy("file.createdAt", "DESC")
      .skip(pagination.skip)
      .take(pagination.limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(data, total, pagination);
  }

  /**
   * Get single file by ID
   */
  async findOne(id: string, userId: string): Promise<File> {
    const file = await this.fileRepository
      .createQueryBuilder("file")
      .leftJoinAndSelect("file.uploadedBy", "uploader")
      .leftJoinAndSelect("file.task", "task")
      .where("file.id = :id", { id })
      .select([
        "file",
        "uploader.id",
        "uploader.fullName",
        "uploader.avatarUrl",
        "task.id",
        "task.title",
      ])
      .getOne();

    if (!file) {
      throw new NotFoundException("File not found");
    }

    await this.projectsService.findOne(file.projectId, userId);

    return file;
  }

  /**
   * Delete file from S3 and database
   */
  async remove(id: string, userId: string): Promise<void> {
    const file = await this.findOne(id, userId);

    // Check permission
    const canDelete = await this.projectsService.hasPermission(
      file.projectId,
      userId,
      "file",
      "delete",
    );
    if (!canDelete && file.uploadedById !== userId) {
      throw new ForbiddenException(
        "You do not have permission to delete this file",
      );
    }

    // Extract S3 key from URL
    const s3Key = this.getS3KeyFromUrl(file.fileUrl);

    // Delete from S3
    const deleteCommand = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
    });

    try {
      await this.s3Client.send(deleteCommand);
    } catch (error) {
      console.error("Error deleting file from S3:", error);
      // Continue to delete from database even if S3 deletion fails
    }

    await this.fileRepository.remove(file);
  }

  /**
   * Get signed download URL (valid for 1 hour)
   */
  async getDownloadUrl(id: string, userId: string): Promise<string> {
    const file = await this.findOne(id, userId);

    // Check permission
    const canDownload = await this.projectsService.hasPermission(
      file.projectId,
      userId,
      "file",
      "download",
    );
    if (!canDownload) {
      throw new ForbiddenException(
        "You do not have permission to download files",
      );
    }

    const s3Key = this.getS3KeyFromUrl(file.fileUrl);

    // Generate signed URL
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      ResponseContentDisposition: `attachment; filename="${file.fileName}"`,
    });

    const signedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    return signedUrl;
  }

  /**
   * Get file stream for download
   */
  async getFileStream(
    id: string,
    userId: string,
  ): Promise<{
    stream: NodeJS.ReadableStream;
    fileName: string;
    mimeType: string;
  }> {
    const file = await this.findOne(id, userId);

    // Check permission
    const canDownload = await this.projectsService.hasPermission(
      file.projectId,
      userId,
      "file",
      "download",
    );
    if (!canDownload) {
      throw new ForbiddenException(
        "You do not have permission to download files",
      );
    }

    const s3Key = this.getS3KeyFromUrl(file.fileUrl);

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
    });

    const response = await this.s3Client.send(command);

    return {
      stream: response.Body as NodeJS.ReadableStream,
      fileName: file.fileName,
      mimeType: file.mimeType,
    };
  }

  /**
   * Extract S3 key from full URL
   */
  private getS3KeyFromUrl(fileUrl: string): string {
    // URL format: https://bucket.s3.region.amazonaws.com/projects/xxx/filename.ext
    const url = new URL(fileUrl);
    return url.pathname.substring(1); // Remove leading slash
  }
}
