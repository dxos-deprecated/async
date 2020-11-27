/**
 * Perform an action and throw if it runs longer then the specified timeout.
 * @param action
 * @param timeout
 * @param getError
 */
export function runWithTimeout<T> (action: () => Promise<T>, timeout: number, getError?: () => Error): Promise<T> {
  function throwOnTimeout (timeout: number, getError: () => Error): Promise<never> {
    // eslint-disable-next-line promise/param-names
    return new Promise((_, reject) => setTimeout(() => reject(getError()), timeout));
  }

  return Promise.race([
    action(),
    throwOnTimeout(timeout, getError ?? (() => new Error(`Timed out in ${timeout}ms.`)))
  ]);
}
