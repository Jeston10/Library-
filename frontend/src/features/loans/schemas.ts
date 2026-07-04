import { z } from 'zod';

export const CheckoutSchema = z.object({
  memberId: z.coerce.number().min(1, 'Member ID is required'),
  bookCopyId: z.coerce.number().min(1, 'Book copy ID is required'),
});

export const RenewSchema = z.object({
  loanId: z.coerce.number().min(1, 'Loan ID is required'),
});

export type CheckoutRequest = z.infer<typeof CheckoutSchema>;
export type RenewRequest = z.infer<typeof RenewSchema>;
