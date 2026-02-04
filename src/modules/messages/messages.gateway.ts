import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly messagesService: MessagesService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinProject')
  handleJoinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() projectId: string,
  ) {
    client.join(`project:${projectId}`);
    return { event: 'joinedProject', data: projectId };
  }

  @SubscribeMessage('leaveProject')
  handleLeaveProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() projectId: string,
  ) {
    client.leave(`project:${projectId}`);
    return { event: 'leftProject', data: projectId };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      projectId: string;
      userId: string;
      content: string;
    },
  ) {
    const message = await this.messagesService.create(
      data.projectId,
      data.userId,
      { content: data.content },
    );

    // Broadcast to all users in the project room
    this.server.to(`project:${data.projectId}`).emit('newMessage', message);

    return message;
  }

  // Method to emit events from service
  emitToProject(projectId: string, event: string, data: any) {
    this.server.to(`project:${projectId}`).emit(event, data);
  }
}
