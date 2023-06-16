import { describe, expect, it } from '@jest/globals';
import { Lock, Lockable, lockify } from '../src';
import { jest } from '@jest/globals';

describe('lockify exports', () => {
  it('exports', () => {
    expect.assertions(2);
    expect(Lock.lockify).toBe(lockify);
    expect(typeof (lockify)).toBe('function')
  });
});

describe('lockify functions that have none params', () => {

  it('functions that not return a Promise would return equal value wrapped with Promise as well', () => {
    const fnNull = () => null;
    const fnUndefined = () => undefined;
    const fnNumber = () => 1;
    const fnObject = () => ({});

    const fnList = [
      fnNull,
      fnUndefined,
      fnNumber,
      fnObject
    ];
    expect.assertions(fnList.length * 2);

    fnList.forEach(async fn => {
      const lockified = lockify(fn as unknown as Lockable<any, any>);
      const result = lockified(fn);
      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toEqual(fn());
    })
  });

  it('lockable function would return equal value', async () => {
    const asyncFn = () => new Promise(resolve => {
      setTimeout(() => {
        resolve({ success: true });
      }, 10);
    });
    expect.assertions(2);
    const lockified = lockify(asyncFn);
    const result = lockified();
    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toEqual(await asyncFn());
  });

  it('waiting function would also receive equal value', async () => {
    let count = 0;
    const asyncFn = () => new Promise(resolve => {
      setTimeout(() => {
        count++;
        resolve({ success: true, count });
      }, 10);
    });
    const lockified = lockify(asyncFn);

    expect.assertions(3);
    const result = lockified();
    expect(result).toBeInstanceOf(Promise);
    await Promise.all([
      expect(result).resolves.toEqual({ success: true, count: 1 }),
      expect(lockified()).resolves.toEqual({ success: true, count: 1 }),
    ]);
  });

  it('lockable function would throw equal error', async () => {
    const asyncFn = async () => {
      return new Promise((_, reject) => {
        setTimeout(() => {
          reject({ success: false });
          // throw new Error('error occurred')
        }, 10);
      })
    };
    const lockified = lockify(asyncFn);
    expect.assertions(1);

    await expect(lockified()).rejects.toEqual({
      success: false
    });
  });

  it('waiting function would also throw equal error', async () => {
    let count = 0;
    const asyncFn = async () => {
      return new Promise((_, reject) => {
        setTimeout(() => {
          count++;
          reject({ success: false });
          // throw new Error('error occurred')
        }, 10);
      })
    };
    const lockified = lockify(asyncFn);
    expect.assertions(3);

    await Promise.all([
      expect(lockified()).rejects.toEqual({
        success: false
      }),
      expect(lockified()).rejects.toEqual({
        success: false
      }),
    ]);
    expect(count).toBe(1);
  });
});

describe('lockify functions that have some params', () => {

  it('functions that not return a Promise would return equal value wrapped with Promise as well', () => {
    const fnNull = (a: any) => null;
    const fnUndefined = (a: any, b: any) => undefined;
    const fnNumber = (a: any) => 1;
    const fnObject = (a: any) => ({});

    const fnList = [
      fnNull,
      fnUndefined,
      fnNumber,
      fnObject
    ];
    expect.assertions(fnList.length * 2);

    fnList.forEach(async fn => {
      const lockified = lockify(fn as unknown as Lockable<any, any>);
      const result = lockified(fn);
      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toEqual(fn(1, 2));
    })
  });


  describe('multiple calls', () => {
    it('equal parameters should reuse same lock', async () => {
      let count = 0;
      const fn = lockify((a: {}, b: number) => {
        return new Promise(resolve => {
          setTimeout(() => {
            count++;
            resolve({ success: true, count });
          }, 10);
        })
      });

      expect.assertions(3);

      await Promise.all([
        expect(fn({ same: 'object' }, 1)).resolves.toEqual({
          success: true, count: 1
        }),
        expect(fn({ same: 'object' }, 1)).resolves.toEqual({
          success: true, count: 1
        })
      ])
      expect(count).toBe(1);
    });

    it('different parameters should not reuse same lock', async () => {
      let count = 0;
      const mockFn = jest.fn((a: {}, b: number) => {
        return new Promise(resolve => {
          setTimeout(() => {
            count++;
            resolve({ success: true, count });
          }, 10);
        })
      });
      const fn = lockify(mockFn);

      expect.assertions(6);

      await Promise.all([
        expect(fn({ same: 'object' }, 1)).resolves.toEqual({
          success: true, count: 1
        }),
        expect(fn({ same: 'object' }, 2)).resolves.toEqual({
          success: true, count: 2
        }),
        expect(fn({ same: 'object' }, 1)).resolves.toEqual({
          success: true, count: 1
        }),
        expect(fn({ same: 'object' }, 3)).resolves.toEqual({
          success: true, count: 3
        })
      ])
      expect(count).toBe(3);
      expect(mockFn).toBeCalledTimes(3);
    });

    it('pass `useParams` to use lock map', async () => {
      let count = 0;
      const mockFn = jest.fn((...args: any[]) => {
        return new Promise(resolve => {
          setTimeout(() => {
            count++;
            resolve({ success: true, count });
          }, 10);
        })
      });
      const fn = lockify(mockFn, true);

      expect.assertions(6);

      await Promise.all([
        expect(fn({ same: 'object' }, 1)).resolves.toEqual({
          success: true, count: 1
        }),
        expect(fn({ same: 'object' }, 2)).resolves.toEqual({
          success: true, count: 2
        }),
        expect(fn({ same: 'object' }, 1)).resolves.toEqual({
          success: true, count: 1
        }),
        expect(fn({ same: 'object' }, 3)).resolves.toEqual({
          success: true, count: 3
        })
      ])
      expect(count).toBe(3);
      expect(mockFn).toBeCalledTimes(3);
    });
  });
});