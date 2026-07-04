import { z } from 'zod';

export const CreateBookSchema = z.object({
  isbn: z.string().min(1, 'ISBN is required'),
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  category: z.string().optional(),
  replacementCost: z.coerce.number().min(0.01, 'Replacement cost must be greater than zero'),
});

export const AddCopySchema = z.object({
  barcode: z.string().min(1, 'Barcode is required'),
});

export const UpdateCopyStatusSchema = z.object({
  status: z.enum(['AVAILABLE', 'LOANED', 'DAMAGED', 'LOST']),
});

export type CreateBookRequest = z.infer<typeof CreateBookSchema>;
export type AddCopyRequest = z.infer<typeof AddCopySchema>;
export type UpdateCopyStatusRequest = z.infer<typeof UpdateCopyStatusSchema>;
