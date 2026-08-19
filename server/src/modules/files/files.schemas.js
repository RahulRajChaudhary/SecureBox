import { z } from 'zod';

export const intentSchema = z.object({
  filename: z.string().min(1).max(255),
  sizeBytes: z.number().int().positive(),
  mimeType: z.string().min(1),
  folderId: z.string().uuid().nullable().optional(),
});

export const resumeSchema = z.object({
  missingParts: z.array(z.number().int().positive()).min(1).max(9500),
});

export const updateSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
    folderId: z.string().uuid().nullable().optional(),
  })
  .refine((data) => data.name || data.visibility || data.folderId !== undefined, {
    message: 'Provide name, visibility, or folderId',
  });

export const listSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().optional(),
  sort: z.enum(['createdAt_desc', 'createdAt_asc', 'name_asc', 'name_desc']).default('createdAt_desc'),
  folderId: z.string().uuid().optional(),
  view: z.enum(['recent', 'shared']).optional(),
});
