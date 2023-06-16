# fn.locky

Lock utils for asynchronous function to avoid concurrent calls.

- ✨ Written in **TypeScript**
- ✨ Locking and unlocking **automatically**
- ✨ **100%** **Tests** coverage
- ✨ **5.2 kb** gzip

## Install

```bash
npm i fn.locky -S
```

## Usage

### Basic usage

use `AsyncLock` in functions

```ts
import { Lock, AsyncLock } from "fn.locky";
// create
const lock = Lock.createAsyncLock();
// or
const lock = new AsyncLock();

// lock
lock.lock();

// inside the function
// judge status to wait or continue
if (lock.locked) {
  // waiting util unlock
  await lock.pending;
}
console.log('done');

// outside the function
// unlock
lock.unlock(); // log 'done'
```

### Advanced usage ✨✨

**`lockify`**

Convert a lockable function to a lockified function, locking and unlocking automatically.

```ts
import { lockify } from "fn.locky";

let count = 0;
const asyncFn = () =>
  new Promise((resolve) => {
    // mock request
    setTimeout(() => {
      resolve({ success: true, count: count++ });
    });
  });

const lockified = lockify(asyncFn);
const result_1 = lockified();
const result_2 = lockified();
const result_3 = lockified();
// ... more calls

// count: 1
// count only add once
// result_1, result_2, result_3: { success: true, count: 1 }
```
