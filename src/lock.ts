/**
 * @example
 * - Async Lock Usage
 *    ```ts
 *    // create
 *    const lock = Lock.createAsyncLock();
 * 
 *    // lock
 *    lock.lock();
 * 
 *    // judge status
 *    if (lock.locked) {
 *      // wait util unlock
 *      await lock.pending;
 *    }
 * 
 *    // unlock
 *    lock.unlock();
 *    ```
 */
abstract class Lock {
  static createAsyncLock() {
    return new AsyncLock();
  }

  abstract get locked(): boolean;
  abstract lock(): void;
  abstract unlock(params?: any, isError?: boolean): void;
}


/**
 * @example
 * - Async Lock Usage
 *    ```ts
 *    // create
 *    const lock = Lock.createAsyncLock();
 * 
 *    // lock
 *    lock.lock();
 * 
 *    // judge status
 *    if (lock.locked) {
 *      // wait util unlock
 *      await lock.pending;
 *    }
 * 
 *    // unlock
 *    lock.unlock();
 *    ```
 */
class AsyncLock<T> extends Lock {
  pending?: Promise<T>;
  private _resolve?: (params?: any) => void;
  private _reject?: (params?: any) => void;

  /**
   * locking state
   */
  get locked() {
    return !!this.pending;
  }

  _constructLock() {
    this.pending = new Promise((resolve, reject) => {
      const unlock = (fn: any) => (params: any) => {
        this.pending = undefined;
        fn(params);
      };
      this._resolve = unlock(resolve);
      this._reject = unlock(reject);
    });

    // for not to trigger UncaughtException
    this.pending.catch(() => null);
  }

  /**
   * lock
   */
  lock() {
    if (!this.locked) {
      this._constructLock();
    }
  }

  /**
   * unlock
   * 
   * if there's error thrown, set `isError` to `true`
   */
  unlock(params?: T, isError?: boolean) {
    if (this.locked) {
      if (isError) {
        this._reject!(params);
      } else {
        this._resolve!(params);
      }
    }
  }
}

export {
  Lock,
  AsyncLock
}