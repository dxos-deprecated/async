/**
 * Perform an action and throw if it runs longer then the specified timeout.
 * @param action
 * @param timeout
 * @param getError
 */
export function runWithTimeout<T> (action: () => Promise<T>, timeout: number, error?: Error): Promise<T> {
  // It's important to create this error object here and not inside `setTimeout` callback because this is the place where the stack trace will be captured.
  const actualError = error ?? new Error(`Timed out in ${timeout}ms.`);
  function throwOnTimeout (): Promise<never> {
    // eslint-disable-next-line promise/param-names
    return new Promise((_, reject) => setTimeout(() => reject(actualError), timeout));
  }

  return Promise.race([
    action(),
    throwOnTimeout()
  ]);
}
