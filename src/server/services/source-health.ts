export function nextSourceFailureState(consecutiveFailureCount: number, threshold: number) {
  const nextFailureCount = consecutiveFailureCount + 1;
  return {
    nextFailureCount,
    shouldPause: nextFailureCount >= threshold,
    reason: nextFailureCount >= threshold
      ? `Automatically paused after ${nextFailureCount} consecutive refresh failures.`
      : null,
  };
}
