import { z } from 'zod';

export const JoinWaitlistSchema = z.object({
  memberId: z.coerce.number().min(1, 'Member ID is required'),
  bookId: z.coerce.number().min(1, 'Book ID is required'),
});

export const CancelReservationSchema = z.object({
  reservationId: z.coerce.number().min(1, 'Reservation ID is required'),
});

export type JoinWaitlistRequest = z.infer<typeof JoinWaitlistSchema>;
export type CancelReservationRequest = z.infer<typeof CancelReservationSchema>;
