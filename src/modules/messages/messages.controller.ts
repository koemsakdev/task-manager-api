import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { User } from '../users/entities/user.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Messages')
@Controller('projects/:projectId/messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message in project chat' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async create(
    @CurrentUser() user: User,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return this.messagesService.create(projectId, user.id, createMessageDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get messages in project chat' })
  @ApiResponse({ status: 200, description: 'Returns list of messages' })
  async findAll(
    @CurrentUser() user: User,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.messagesService.findAll(projectId, user.id, pagination);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent messages' })
  async getRecent(
    @CurrentUser() user: User,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('limit') limit?: number,
  ) {
    return this.messagesService.getRecentMessages(projectId, user.id, limit);
  }
}
