import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const EnsureBudgetSchema = z.object({
  name: z.string().min(1),
});
export class EnsureBudgetDto extends createZodDto(EnsureBudgetSchema) {}

export const EnsureCategorySchema = z.object({
  name: z.string().min(1),
});
export class EnsureCategoryDto extends createZodDto(EnsureCategorySchema) {}

export const EnsureTagSchema = z.object({
  tag: z.string().min(1),
});
export class EnsureTagDto extends createZodDto(EnsureTagSchema) {}

export const FireflyResourceResponseSchema = z.object({
  id: z.string(),
});
export class FireflyResourceResponseDto extends createZodDto(
  FireflyResourceResponseSchema,
) {}
