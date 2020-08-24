/**
 * Returns a tuple containing a Promise that will be resolved when the resolver function is called.
 */
export const trigger = <T>(timeout?: number): [() => Promise<T>, (arg: T) => void] => {
  let callback: (arg: T) => void;
  const promise = new Promise<T>((resolve, reject) => {
    if (timeout) {
      setTimeout(() => reject(new Error(`Timed out after ${timeout}ms`)), timeout);
    }
    callback = resolve;
  });

  return [
    () => promise,
    (value) => callback(value)
  ];
};

// TODO(burdon): Remove.
/**
 * Use `trigger` instead.
 * @deprecated
 */
export const useValue = trigger;
