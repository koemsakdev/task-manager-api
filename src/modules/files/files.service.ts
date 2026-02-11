import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
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
  private uploadPath: string;

  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    private projectsService: ProjectsService,
    private activityLogsService: ActivityLogsService,
    private configService: ConfigService,
  ) {
    this.uploadPath = this.configService.get("UPLOAD_DEST", "./uploads");
    // Ensure upload directory exists
    try {
      if (!fs.existsSync(this.uploadPath)) {
        fs.mkdirSync(this.uploadPath, { recursive: true });
      }
    } catch (error) {
      console.log("Skipping folder creation for serverless environment");
    }
  }

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
    const filePath = path.join(this.uploadPath, projectId);

    // Create project directory if not exists
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, { recursive: true });
    }

    const fullPath = path.join(filePath, uniqueName);

    // Save file
    fs.writeFileSync(fullPath, file.buffer);

    const fileEntity = this.fileRepository.create({
      projectId,
      taskId: taskId || null,
      uploadedById: userId,
      fileName: file.originalname,
      fileUrl: `/uploads/${projectId}/${uniqueName}`,
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

    // Delete physical file
    const fullPath = path.join(process.cwd(), file.fileUrl);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    await this.fileRepository.remove(file);
  }

  async getDownloadPath(id: string, userId: string): Promise<string> {
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

    return path.join(process.cwd(), file.fileUrl);
  }
}
