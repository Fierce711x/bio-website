import { Request as req } from 'express';
import { User } from '../generated/client.ts';
export type Request = req & { user: User };
