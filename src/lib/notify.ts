import "server-only";

/**
 * Notification hook point. v1 ships without email; when SMTP is wanted,
 * implement these with nodemailer (SMTP_* env vars) — callers already pass
 * everything a confirmation email needs.
 */

export interface BookingNotification {
  bookingId: string;
  name: string;
  characterName: string;
  contactMethod: string;
  contactValue: string;
  eventTitle: string;
  slotStart: Date;
  slotEnd: Date;
  manageUrl: string; // visitor's cancel/view link
}

export async function notifyBookingCreated(
  _info: BookingNotification
): Promise<void> {
  // no-op (email not configured in v1)
}

export async function notifyBookingCancelled(
  _info: BookingNotification
): Promise<void> {
  // no-op (email not configured in v1)
}
