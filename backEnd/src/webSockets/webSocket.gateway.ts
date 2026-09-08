import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import WebSocket from 'ws';
import { IncomingMessage } from 'http';
import { parseCookie } from 'cookie';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '#src/modules/userModule/user.service.js';
import type { JwtPayload } from '#src/modules/authModule/types/jwt.js';
import { AuthenticatedUser } from '#auth/types/user.js';
import { Logger } from '@nestjs/common';
interface Connection extends WebSocket {
  user: AuthenticatedUser | undefined;
}
@WebSocketGateway()
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger: Logger = new Logger(AppGateway.name);
  private readonly connections: Map<string, Connection> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}
  async handleConnection(socket: Connection, request: IncomingMessage) {
    const cookies = parseCookie(request.headers.cookie ?? '');
    if (!cookies.accessToken) {
      socket.close(4001, 'Unauthorized');
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        cookies.accessToken,
      );
      const user = await this.userService.findUserById(payload.sub);
      if (!user) {
        socket.close(4001, 'Unauthorized');
        return;
      }

      socket.user = {
        id: user.id,
        username: user.username,
        role: user.role,
      };
      const existingConnection = this.connections.get(user.id);
      if (existingConnection) {
        existingConnection.close(4002, 'Logged in from another device');
      }
      this.connections.set(user.id, socket);
      this.logger.log(`Connected user:${socket.user.username}`);
    } catch (err) {
      this.logger.log(err);
      socket.close(4001, 'Unauthorized');
    }
  }
  handleDisconnect(socket: Connection) {
    console.log('closing connection');
    if (socket.user === undefined) {
      this.logger.log('user is not authenticated');
      return;
    }
    const userId = socket.user.id;
    if (userId && this.connections.get(userId) === socket) {
      this.connections.delete(userId);
      this.logger.log(
        `user ${socket.user.username} has been disconnected and was cleared from the registery`,
      );
    }
  }
}
