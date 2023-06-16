/** Functions that can be locked must return a `Promise` */
export type Lockable<T = any, P extends any[] = []> = (...args: P) => Promise<T>;
/** Functions protected by locks */
export type Lockified<T = any, P extends any[] = []> = (...args: P) => Promise<T>;
