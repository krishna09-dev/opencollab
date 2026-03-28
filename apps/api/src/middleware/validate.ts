import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

// Extend Express Request to include validated data
declare global {
  namespace Express {
    interface Request {
      validated?: {
        body: any;
        params: any;
        query: any;
      };
    }
  }
}

/**
 * Validation middleware using Zod schemas
 * Usage: router.post("/path", validate(schema), handler)
 *
 * Access validated data via req.validated.body, req.validated.params, req.validated.query
 */
export function validate<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!result.success) {
      const formatted = result.error.flatten();
      return res.status(400).json({
        message: "Validation failed",
        errors: {
          ...formatted.fieldErrors,
          ...(Object.keys(formatted.formErrors).length > 0 ? { _form: formatted.formErrors } : {})
        }
      });
    }

    req.validated = result.data as { body: any; params: any; query: any };
    next();
  };
}
