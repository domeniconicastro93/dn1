/**
 * Response Utilities Tests
 */

// @ts-nocheck - Test file, type checking disabled
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { describe, it, expect } from '@jest/globals';
import { successResponse, errorResponse, ErrorCodes } from '../src/response';

describe('Response Utilities', () => {
  describe('successResponse', () => {
    it('should create a success response with data', () => {
      const response = successResponse({ id: '123', name: 'Test' });

      expect(response).toEqual({
        data: { id: '123', name: 'Test' },
      });
    });

    it('should create a success response with data and meta', () => {
      const response = successResponse(
        { id: '123' },
        { total: 100, page: 1 }
      );

      expect(response).toEqual({
        data: { id: '123' },
        meta: { total: 100, page: 1 },
      });
    });
  });

  describe('errorResponse', () => {
    it('should create an error response with code and message', () => {
      const response = errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid input');

      expect(response).toEqual({
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Invalid input',
        },
      });
    });

    it('should create an error response with details', () => {
      const response = errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid input',
        { field: 'email', reason: 'Invalid format' }
      );

      expect(response).toEqual({
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Invalid input',
          details: { field: 'email', reason: 'Invalid format' },
        },
      });
    });
  });

  describe('ErrorCodes', () => {
    it('should have all required error codes', () => {
      expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCodes.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(ErrorCodes.FORBIDDEN).toBe('FORBIDDEN');
      expect(ErrorCodes.NOT_FOUND).toBe('NOT_FOUND');
      expect(ErrorCodes.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
      expect(ErrorCodes.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    });
  });
});

