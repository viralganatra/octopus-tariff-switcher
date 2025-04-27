import { fromError, isZodErrorLike } from 'zod-validation-error';
import { logger } from './logger';

export function formatResponse(statusCode: number, payload: object | Error) {
  return {
    statusCode,
    body: JSON.stringify(payload, null, 2),
  };
}

export function formatErrorResponse(error: Error) {
  if (isZodErrorLike(error)) {
    const validationError = fromError(error);
    const message = validationError.toString();

    logger.error('Schema validation error', {
      errorMessage: message,
      originalError: error,
    });

    return formatResponse(400, { message });
  }

  const message = String(error);

  logger.error('Unhandled error', {
    errorMessage: message,
    originalError: error,
  });

  return formatResponse(500, { message });
}
