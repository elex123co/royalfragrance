/** Turns a Nigerian phone number into a wa.me link, with an optional prefilled message. */
export function waLink(phone: string | null | undefined, message?: string): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) digits = `234${digits.slice(1)}`;
  else if (digits.length === 10) digits = `234${digits}`;
  if (digits.length < 11) return null;
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}
