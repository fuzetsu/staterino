declare module 'staterino' {
  type FunctionSelector<S, T = any> = (state: S) => T
  type Selector<S, T = any> = FunctionSelector<S, T> | string

  type SelectorArrayToTuple<S, T extends Selector<S>[] | []> = {
    [K in keyof T]: T[K] extends FunctionSelector<S> ? ReturnType<T[K]> : any
  }

  type Unsubscribe = () => void
  type CleanupCallback = () => void

  interface Subscribe<S> {
    (callback: (value: S) => void | CleanupCallback): Unsubscribe
    <T>(selector: Selector<S, T>, callback: (value: T) => void | CleanupCallback): Unsubscribe
    <T extends Selector<S>[] | []>(
      selectors: T,
      callback: (
        ...values: T extends any[] ? SelectorArrayToTuple<S, T> : never
      ) => void | CleanupCallback
    ): Unsubscribe
  }

  interface StoreHook<S> {
    (): S
    <T>(selector: Selector<S, T>): T
    <T extends Selector<S>[] | []>(selectors: T): SelectorArrayToTuple<S, T>
    set: (patch: import('mergerino').MultipleTopLevelPatch<S>) => void
    get: () => S
    subscribe: Subscribe<S>
  }

  interface CreateHook {
    <S>(conf: {
      state: S
      hooks: { useReducer: any; useLayoutEffect: any }
      merge: import('mergerino').Merge<S>
    }): StoreHook<S>
  }

  const staterino: CreateHook

  export default staterino
}
