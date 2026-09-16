import { AuthenticatedUser } from '#auth/types/user.js';
import { Injectable } from '@nestjs/common';
import { WebSocket } from 'ws';
export interface Connection extends WebSocket {
  user?: AuthenticatedUser;
  connectionId?: string;
  deviceId: string;
  isAlive: boolean;
}
@Injectable()
export class ConnectionsStorage {
  private readonly connections: Map<string, Connection> = new Map();

  getConnection(userId: string) {
    return this.connections.get(userId);
  }

  setConnection(userId: string, connection: Connection) {
    this.connections.set(userId, connection);
  }

  deleteConnection(userId: string) {
    this.connections.delete(userId);
  }

  isActiveSession(userId: string, connectionId: string): boolean {
    const connection = this.connections.get(userId);
    if (connection && connection.connectionId === connectionId) return true;
    return false;
  }
}
