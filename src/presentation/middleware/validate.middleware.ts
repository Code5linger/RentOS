// src/presentation/middleware/validate.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '@domain/errors/domain.errors';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const fields = formatZodErrors(result.error);
      return next(new ValidationError('Validation failed', fields));
    }

    req.body = result.data; // replace with parsed+coerced data
    next();
  };
}

function formatZodErrors(error: ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'root';
    if (!fields[path]) fields[path] = [];
    fields[path].push(issue.message);
  }

  return fields;
}
