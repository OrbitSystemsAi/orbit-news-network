export function requiredRefreshMinutes(sourceMinutes: number, projectMinutes: number) {
  return Math.max(sourceMinutes, projectMinutes);
}

export function isSourceFresh(lastSuccessful: Date | null, sourceMinutes: number, projectMinutes: number, now = new Date()) {
  if (!lastSuccessful) return false;
  return lastSuccessful.getTime() >= now.getTime() - requiredRefreshMinutes(sourceMinutes, projectMinutes) * 60_000;
}

export function isRefreshLocked(lockAt: Date | null, now = new Date(), timeoutMinutes = 5) {
  return Boolean(lockAt && lockAt.getTime() > now.getTime() - timeoutMinutes * 60_000);
}
