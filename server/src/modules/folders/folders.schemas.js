import { z } from 'zod';

export const createFolderSchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.string().uuid().nullable().optional(),
});

export const listFoldersSchema = z.object({
  parentId: z.string().uuid().optional(),
});

export const updateFolderSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    parentId: z.string().uuid().nullable().optional(),
    visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
  })
  .refine(
    (data) => data.name !== undefined || data.parentId !== undefined || data.visibility !== undefined,
    { message: 'Provide name, parentId, or visibility' },
  );
