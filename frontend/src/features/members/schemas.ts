import { z } from 'zod';

export const RegisterMemberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  tier: z.enum(['REGULAR', 'SUPPORTING']),
});

export const UpdateMemberStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
});

export const UpdateMemberTierSchema = z.object({
  tier: z.enum(['REGULAR', 'SUPPORTING']),
});

export type RegisterMemberRequest = z.infer<typeof RegisterMemberSchema>;
export type UpdateMemberStatusRequest = z.infer<typeof UpdateMemberStatusSchema>;
export type UpdateMemberTierRequest = z.infer<typeof UpdateMemberTierSchema>;
