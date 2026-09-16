export async function asyncAbort<T>(
  promise: Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  if (signal.aborted) throw new Error('action aborted');
  let abortListener: (() => void) | undefined;
  const abortPromise = new Promise<never>((_, rej) => {
    abortListener = () => rej(new Error('action aborted'));
    signal.addEventListener('abort', abortListener);
  });

  return Promise.race([promise, abortPromise]).finally(
    () => abortListener && signal.removeEventListener('abort', abortListener),
  );
}
