import { z } from 'zod';

export const intentSchema = z.object({
  filename: z.string().min(1).max(255),
  sizeBytes: z.number().int().positive(),
  mimeType: z.string().min(1),
});

export const resumeSchema = z.object({
  missingParts: z.array(z.number().int().positive()).min(1).max(9500),
});

export const updateSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
  })
  .refine((data) => data.name || data.visibility, {
    message: 'Provide name or visibility',
  });

export const listSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().optional(),
  sort: z.enum(['createdAt_desc', 'createdAt_asc', 'name_asc', 'name_desc']).default('createdAt_desc'),
});
