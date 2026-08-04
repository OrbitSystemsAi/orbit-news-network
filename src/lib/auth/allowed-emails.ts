export function parseAllowedEmails(value: string) {
  return new Set(
    value.split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}
