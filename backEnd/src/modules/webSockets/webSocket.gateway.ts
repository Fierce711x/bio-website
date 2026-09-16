import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketServer,
} from '@nestjs/websockets';
import { OnModuleDestroy } from '@nestjs/common';
import { IncomingMessage } from 'http';
import { parseCookie } from 'cookie';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '#src/modules/userModule/user.service.js';
import type { JwtPayload } from '#src/modules/authModule/types/jwt.js';
import { Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  Connection,
  ConnectionsStorage,
} from './connectionsStroage.service.js';
import { PrismaService } from '../prismaModule/prisma.service.js';
import type { Server } from 'ws';
import { asyncAbort } from '../authModule/utils/asyncAbort.js';
@WebSocketGateway({ path: '/connect' })
export class AppGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleDestroy
{
  private readonly logger: Logger = new Logger(AppGateway.name);
  @WebSocketServer()
  private readonly server: Server;
  private heartbeatInterval: NodeJS.Timeout;

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly connectionsStorage: ConnectionsStorage,
  ) {}

  afterInit() {
    this.heartbeatInterval = setInterval(() => {
      this.server.clients.forEach((client) => {
        const ws = client as Connection;

        if (ws.isAlive === false) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 15000);
  }

  async handleConnection(socket: Connection, request: IncomingMessage) {
    const cookies = parseCookie(request.headers.cookie ?? '');
    if (!cookies.accessToken || !cookies.deviceId) {
      socket.close(4001, 'Unauthorized');
      return;
    }

    socket.isAlive = true;
    socket.on('pong', () => {
      socket.isAlive = true;
    });

    const abortController = new AbortController();
    const { signal } = abortController;
    const handleAbort = () => {
      abortController.abort();
      socket.terminate();
    };
    socket.once('close', handleAbort);

    try {
      const payload = await asyncAbort(
        this.jwtService.verifyAsync<JwtPayload>(cookies.accessToken),
        signal,
      );
      const session = await asyncAbort(
        this.prisma.session.findUnique({
          where: { id: payload.sessionId },
          include: {
            user: true,
          },
        }),
        signal,
      );
      if (!session || payload.sub !== session.userId) {
        socket.close(4001, 'Unauthorized');
        return;
      }

      const existingConnection = this.connectionsStorage.getConnection(
        session.user.id,
      );
      if (existingConnection) {
        if (cookies.deviceId !== existingConnection.deviceId) {
          await this.prisma.session.deleteMany({
            where: {
              userId: session.user.id,
              deviceId: cookies.deviceId,
            },
          });

          socket.close(4003, 'Logged in from another device');
          console.log('duplicate');
          return;
        }
        socket.close(4003, 'Logged in from another tab');
        console.log('duplicate');
        return;
      }

      const connectionId = randomUUID();
      socket.connectionId = connectionId;
      socket.user = {
        id: session.user.id,
        username: session.user.username,
        role: session.user.role,
      };
      socket.deviceId = cookies.deviceId;
      this.connectionsStorage.setConnection(session.user.id, socket);

      socket.send(
        JSON.stringify({ event: 'session-authorized', data: { connectionId } }),
      );
      this.logger.log(`Connected user: ${socket.user.username}`);

      socket.off('close', handleAbort);
    } catch (err) {
      if (!(err instanceof Error) || !(err.message === 'action aborted'))
        this.logger.error(err);
      socket.close(4001, 'Unauthorized');
    }
  }

  handleDisconnect(socket: Connection) {
    if (socket.user === undefined) {
      this.logger.log('user is not authenticated');
      return;
    }

    const userId = socket.user.id;
    if (this.connectionsStorage.getConnection(userId) === socket) {
      this.connectionsStorage.deleteConnection(userId);
      this.logger.log(
        `user ${socket.user.username} has been disconnected and was cleared from the registery`,
      );
    }
  }

  onModuleDestroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }
}
