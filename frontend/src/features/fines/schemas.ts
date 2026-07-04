import { z } from 'zod';

export const PayFineSchema = z.object({
  fineId: z.coerce.number().min(1, 'Fine ID is required'),
});

export const WaiveFineSchema = z.object({
  fineId: z.coerce.number().min(1, 'Fine ID is required'),
});

export type PayFineRequest = z.infer<typeof PayFineSchema>;
export type WaiveFineRequest = z.infer<typeof WaiveFineSchema>;
