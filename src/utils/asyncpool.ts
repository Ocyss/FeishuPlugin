import type { LimitFunction } from 'p-limit'
import pLimit from 'p-limit'

export class _AsyncPool<T> {
  private runnableQueue: (() => Promise<T>)[]
  private workers: Promise<void>[]
  private asyncLimit: number
  private res: T[]

  constructor(asyncLimit: number) {
    this.asyncLimit = asyncLimit
    this.runnableQueue = []
    this.workers = []
    this.res = []
  }

  /* Runs all functions in runnableQueue by launching asyncLimit worker instances
    each of which calls an async task extracted from runnableQueue. This will
    wait for all scheduled tasks to be completed. */
  public async runAll(): Promise<T[]> {
    this.res.length = 0
    for (let i = 0; i < this.asyncLimit; i++)
      this.workers.push(this.worker())
    await Promise.all(this.workers)
    return this.res
  }

  /* Takes in an async Thunk to be executed by the asyncpool */
  public addTask(func: () => Promise<T>): void {
    this.runnableQueue.push(func)
  }

  /* Executes each passed in async function blocking while each function is run.
    Moves on to the next available thunk on completion of the previous thunk. */
  private async worker(): Promise<void> {
    while (this.runnableQueue.length > 0) {
      const func = this.runnableQueue.pop()
      // Avoids possible race condition
      if (func)
        this.res.push(await func())
    }
  }
}

type ResolvedReturnType<T extends (...args: any) => any> = ReturnType<T> extends Promise<infer R> ? R : ReturnType<T>

export class AsyncPool<T extends (...args: any[]) => Promise<any>> {
  private limit: LimitFunction
  private fn: T
  private workers: Promise<void>[]
  private res: NonNullable<ResolvedReturnType<T>>[]
  private finish = false

  constructor(fn: T, poolSize = 500) {
    this.limit = pLimit(poolSize)
    this.fn = fn
    this.res = []
    this.workers = []
  }

  run(...data: Parameters<T>) {
    if (this.finish)
      throw new Error('AsyncPool has already been finished')
    const p = this.limit(() => this.fn(...data).then((res: ResolvedReturnType<T>) => {
      if (res !== null && res !== undefined)
        this.res.push(res)
    }))
    this.workers.push(p)
  }

  async resultHooks(fn: (value: Array<NonNullable<ResolvedReturnType<T>>>) => any, size = 500) {
    const res = []
    while (!this.finish || this.res.length > size) {
      if (this.res.length > 0) {
        const v = this.res.shift()
        if (v !== undefined) {
          res.push(v)
          if (res.length >= size) {
            await fn(res)
            res.length = 0
          }
        }
      }
      else {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }
    if (res.length > 0)
      await fn(res)
    if (this.res.length > 0)
      await fn(this.res)
  }

  async all() {
    try {
      await Promise.all(this.workers)
    }
    finally {
      this.finish = true
    }
  }
}
