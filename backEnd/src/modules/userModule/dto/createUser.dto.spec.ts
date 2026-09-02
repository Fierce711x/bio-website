import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto } from './createUser.dto.js';
import { StudentGrade } from '#src/generated/enums.js';
import { describe, expect, it } from '@jest/globals';

describe('CreateUserDto', () => {
  const createDto = (data: Record<string, unknown>) =>
    plainToInstance(CreateUserDto, data);

  const validDto = {
    username: 'testuser',
    email: 'test@gmail.com',
    grade: StudentGrade.SEC_3,
    phone: '01002265987',
    password: 'Test1234',
  };

  describe('username', () => {
    it('should pass with a valid username (8-50 chars)', async () => {
      const dto = createDto(validDto);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with a username shorter than 8 chars', async () => {
      const dto = createDto({ ...validDto, username: 'short' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with a username longer than 50 chars', async () => {
      const dto = createDto({ ...validDto, username: 'a'.repeat(51) });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should transform username to lowercase', () => {
      const dto = createDto({ ...validDto, username: 'TestUser' });
      expect(dto.username).toBe('testuser');
    });
  });

  describe('email', () => {
    it('should pass with a valid email', async () => {
      const dto = createDto(validDto);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with an invalid email', async () => {
      const dto = createDto({ ...validDto, email: 'not-an-email' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should transform email to lowercase', () => {
      const dto = createDto({ ...validDto, email: 'Test@Gmail.com' });
      expect(dto.email).toBe('test@gmail.com');
    });
  });

  describe('grade', () => {
    it('should pass with a valid grade', async () => {
      const dto = createDto(validDto);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with an invalid grade', async () => {
      const dto = createDto({ ...validDto, grade: 'INVALID_GRADE' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('phone', () => {
    it('should pass with a valid Egyptian phone number', async () => {
      const dto = createDto(validDto);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with an invalid phone number', async () => {
      const dto = createDto({ ...validDto, phone: '12345' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('password', () => {
    it('should pass with a strong password', async () => {
      const dto = createDto(validDto);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with a password shorter than 8 chars', async () => {
      const dto = createDto({ ...validDto, password: 'Te1' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with a password without uppercase', async () => {
      const dto = createDto({ ...validDto, password: 'test1234' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with a password without a number', async () => {
      const dto = createDto({ ...validDto, password: 'Testtest' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
