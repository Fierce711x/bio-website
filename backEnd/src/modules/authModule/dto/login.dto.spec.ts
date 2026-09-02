import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from './login.dto.js';
import { describe, expect, it } from '@jest/globals';

describe('LoginDto', () => {
  const createDto = (data: Record<string, unknown>) =>
    plainToInstance(LoginDto, data);
  describe('identifier', () => {
    it('should pass with a valid email', async () => {
      const dto = createDto({
        identifier: 'test@gmail.com',
        password: 'Test1234',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass with a valid username (8-50 chars)', async () => {
      const dto = createDto({ identifier: 'testuser', password: 'Test1234' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with an invalid email', async () => {
      const dto = createDto({
        identifier: 'email',
        password: 'Test1234',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with a username shorter than 8 chars', async () => {
      const dto = createDto({ identifier: 'short', password: 'Test1234' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with a username longer than 50 chars', async () => {
      const dto = createDto({
        identifier: 'a'.repeat(51),
        password: 'Test1234',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('password', () => {
    it('should pass with a strong password (min 8, upper, lower, number)', async () => {
      const dto = createDto({
        identifier: 'test@gmail.com',
        password: 'Test1234',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with a password shorter than 8 chars', async () => {
      const dto = createDto({ identifier: 'test@gmail.com', password: 'Te1' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with a password without uppercase', async () => {
      const dto = createDto({
        identifier: 'test@gmail.com',
        password: 'test1234',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with a password without a number', async () => {
      const dto = createDto({
        identifier: 'test@gmail.com',
        password: 'Testtest',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with a password without lowercase', async () => {
      const dto = createDto({
        identifier: 'test@gmail.com',
        password: 'TEST1234',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
