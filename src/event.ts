/**
 * An EventEmitter variant that does not do event multiplexing and respresents a single event.
 *
 * ## Typical usage:
 * ```javascript
 * class Model {
 *   public readonly update = new Event<UpdateData>();
 *   private readonly privateEvent = new Event<void>();
 *
 *   onUpdate(data: UpdateData) {
 *     ...
 *     this.update.emit(data);
 *   }
 * }
 *
 *
 * model.update.on(data => {
 *   ...
 * });
 * ```
 *
 * ## Advantages over traditional EventEmitter:
 * 1. User describes explicitly what events a class has as they are defined as class fields.
 * 2. User can explicitly define event visibility (public, protected, private).
 * 3. Havings events as class fields allows the compiler to check for correct event usage.
 * 4. User can type the data that event will be emitting.
 * 5. Uses composition instead of inheritance.
 * 6. Removes the cases where event names intersect when used in cases with inheritance.
 * 7. Remove the need to namespace events when developing a class with events that will be used as a base-class.
 */
export class Event<T = void> implements ReadOnlyEvent<T> {
  private readonly _listeners = new Set<(data: T) => void>();
  private readonly _onceListeners = new Set<(data: T) => void>();

  /**
   * Emit an event.
   *
   * In most cases should only be called by the class or enitity containing the event.
   *
   * All listeners are called in order of subscription with presistent ones first.
   * Calls are performed asynchronously through `setImmeidate` callback.
   *
   * @param data param that will be passed to all listeners.
   */
  emit (data: T) {
    for (const listener of this._listeners) {
      this._trigger(listener, data);
    }

    for (const listener of this._onceListeners) {
      this._trigger(listener, data);
      this._onceListeners.delete(listener);
    }
  }

  private _trigger (listener: (data: T) => void, data: T) {
    setImmediate(() => {
      try {
        listener(data);
      } catch (err) {
        console.log(`Unhandled error in Event listener: ${err}`);
      }
    });
  }

  /**
   * Register an event listener.
   *
   * If provided callback was already registered as once-listener, it is made permanent.
   *
   * @param callback
   * @returns function that unsubscribes this event listener
   */
  on (callback: (data: T) => void): () => void {
    if (this._onceListeners.has(callback)) {
      this._onceListeners.delete(callback);
    }

    this._listeners.add(callback);
    return () => this.off(callback);
  }

  /**
   * Unsubscribe this callback from new events. Inncludes persistent and once-listeners.
   *
   * NOTE: It is recomended to use `Event.on`'s return value instead.
   *
   * If the callback is not subscribed this is no-op.
   *
   * @param callback
   */
  off (callback: (data: T) => void) {
    this._listeners.delete(callback);
    this._onceListeners.delete(callback);
  }

  /**
   * Register a callback to be called only once when the next event is emitted.
   *
   * If this callback is already registered as permanent listener, this is no-op.
   *
   * @param callback
   */
  once (callback: (data: T) => void): () => void {
    if (this._listeners.has(callback)) {
      return () => {};
    }

    this._onceListeners.add(callback);
    return () => this._onceListeners.delete(callback);
  }

  /**
   * An async iterator that iterates over events.
   *
   * This iterator runs indefinitely.
   */
  async * [Symbol.asyncIterator] (): AsyncIterator<T> {
    while (true) {
      yield await new Promise(resolve => { this.once(resolve); });
    }
  }

  /**
   * Returns a promise that resolves with the first event emitted that matches the provided predicate.
   *
   * @param predicate
   */
  waitFor (predicate: (data: T) => boolean): Promise<T> {
    return new Promise((resolve) => {
      const unsubscribe = this.on(data => {
        if (predicate(data)) {
          unsubscribe();
          resolve(data);
        }
      });
    });
  }

  /**
   * Returns a promise that resolves once a specific number of events was emitted since this method was called.
   * @param expectedCount
   */
  waitForCount (expectedCount: number): Promise<T> {
    let count = 0;
    return this.waitFor(() => ++count === expectedCount);
  }

  /**
   * Returns the number of persistent listeners.
   */
  listenerCount() {
    return this._listeners.size;
  }
}

/**
 * A version of Event class which only has subscribe methods.
 *
 * Usefull in cases where you want to explicitly prohibit calling `emit` method.
 */
export interface ReadOnlyEvent<T = void> {
  /**
   * Register an event listener.
   *
   * If provided callback was already registered as once-listener, it is made permanent.
   *
   * @param callback
   * @returns function that unsubscribes this event listener
   */
  on(callback: (data: T) => void): () => void;

  /**
   * Unsubscribe this callback from new events. Inncludes persistent and once-listeners.
   *
   * NOTE: It is recomended to us `Event.on`'s return value.
   *
   * If the callback is not subscribed this is no-op.
   *
   * @param callback
   */
  off(callback: (data: T) => void): void;

  /**
   * Register a callback to be called only once when the next event is emitted.
   *
   * If this callback is already registered as permanent listener, this is no-op.
   *
   * @param callback
   */
  once(callback: (data: T) => void): () => void;

  /**
   * An async iterator that iterates over events.
   *
   * This iterator runs indefinitely.
   */
  [Symbol.asyncIterator](): AsyncIterator<T>;

  /**
   * Returns a promise that resolves with the first event emitted that matches the provided predicate.
   *
   * @param predicate
   */
  waitFor(predicate: (data: T) => boolean): Promise<T>;

  /**
   * Returns a promise that resolves once a specific number of events was emitted since this method was called.
   * @param expectedCount
   */
  waitForCount(expectedCount: number): Promise<T>;
}
