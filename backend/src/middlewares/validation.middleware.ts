import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { ApiResponse } from "../types";

type ValidationSource = "body" | "query" | "params";

const formatZodErrors = (error: z.ZodError): string[] => {
  return error.errors.map((err) => {
    const path = err.path.join(".");
    return path ? `${path}: ${err.message}` : err.message;
  });
};

export const validate = <TOutput, TInput = TOutput>(
  schema: z.ZodType<TOutput, z.ZodTypeDef, TInput>,
  source: ValidationSource = "body",
) => {
  return (req: Request, res: Response<ApiResponse<null>>, next: NextFunction): void => {
    const data = req[source];
    const result = schema.safeParse(data);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: formatZodErrors(result.error).join(", "),
      });
      return;
    }

    // Attach validated data to res.locals for use in controllers
    res.locals.validated = result.data;
    next();
  };
};

export const validateBody = <TOutput, TInput = TOutput>(schema: z.ZodType<TOutput, z.ZodTypeDef, TInput>) =>
  validate(schema, "body");

export const validateQuery = <TOutput, TInput = TOutput>(schema: z.ZodType<TOutput, z.ZodTypeDef, TInput>) =>
  validate(schema, "query");

export const validateParams = <TOutput, TInput = TOutput>(schema: z.ZodType<TOutput, z.ZodTypeDef, TInput>) =>
  validate(schema, "params");
