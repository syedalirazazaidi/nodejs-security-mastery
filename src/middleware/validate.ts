import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';

// Validation middleware
export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      }) as { body?: any; query?: any; params?: any };
      
      // Replace request data with validated and transformed data
      if (validated.body) req.body = validated.body;
      if (validated.query) req.query = validated.query;
      if (validated.params) req.params = validated.params;
      
      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.issues.map((err) => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
      return;
    }
  };
};

