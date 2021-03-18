const { useReducer, useLayoutEffect } = require('preact/hooks')
const { render, act } = require('@testing-library/preact')
const staterino = require('./dist/staterino.es5')
const merge = require('mergerino')
const { h } = require('preact')

const mergeMock = jest.fn(merge)

const createHook = state =>
  staterino({
    state,
    merge: mergeMock,
    hooks: { useReducer, useLayoutEffect }
  })

const baseState = {
  one: true,
  hello: 5,
  deep: { f: 1 }
}

const mount = args => {
  const result = { current: undefined }
  const redraws = { current: 0 }
  const Cmp = () => {
    result.current = useStore(args)
    redraws.current += 1
    return null
  }
  render(h(Cmp))
  return [result, redraws]
}

const mountSub = (...args) => {
  const result = { current: undefined }
  const calls = { current: 0 }
  const callback = args.length > 1 && args.pop()
  const unSub = useStore.subscribe(...args, (...slices) => {
    result.current = slices.length === 1 ? slices[0] : slices
    calls.current += 1
    return callback && callback(...slices)
  })
  return [result, calls, unSub]
}

let useStore
beforeEach(() => {
  useStore = createHook(baseState)
  mergeMock.mockClear()
})

it('basic usage works', () => {
  const [result, redraws] = mount()
  expect(result.current).toBe(baseState)

  const patch = { two: true, hello: 10, deep: { r: 1 } }
  act(() => useStore.set(patch))

  expect(result.current).toStrictEqual({ one: true, two: true, hello: 10, deep: { f: 1, r: 1 } })
  expect(redraws.current).toBe(2)
})

describe('useStore()', () => {
  it('no arguments works', () => {
    const [result] = mount()
    expect(result.current).toBe(baseState)
  })
  it('single function selector works', () => {
    const [result] = mount(s => s.one)
    expect(result.current).toBe(true)
  })
  it('single string selector works', () => {
    const [result] = mount('one')
    expect(result.current).toBe(true)
  })
  it('array of function/string selectors', () => {
    const [result, redraws] = mount([
      s => s.one,
      s => s.hello,
      s => s.blah,
      'deep.f',
      'deep.fake.deeper'
    ])
    expect(result.current).toStrictEqual([true, 5, undefined, 1, undefined])
    expect(redraws.current).toBe(1)

    // only redraws once when multiple selectors change
    act(() => useStore.set({ blah: 400, hello: 10 }))
    expect(redraws.current).toBe(2)
    expect(result.current).toStrictEqual([true, 10, 400, 1, undefined])
  })
  it('only redraws once when multiple selectors change', () => {
    const [, redraws] = mount(['one', 'two', 'three'])
    expect(redraws.current).toBe(1)
    act(() => useStore.set({ one: 55, two: 55, three: 55 }))
    expect(redraws.current).toBe(2)
  })
  it('does not redraw for unrelated state changes', () => {
    const [, redraws] = mount(['one', s => s.deep.f])
    expect(redraws.current).toBe(1)
    act(() => useStore.set({ other: true, deep: { other: true } }))
    expect(redraws.current).toBe(1)
  })
})

describe('useStore.set()', () => {
  it('uses mergerino under the hood', () => {
    useStore.set({ test: true })
    expect(mergeMock).toHaveBeenCalledTimes(1)
    expect(mergeMock).toHaveReturnedWith(useStore.get())
    expect(mergeMock).toHaveBeenCalledWith(baseState, { test: true })
  })
})

describe('useStore.subscribe()', () => {
  it('no selector redraws on every state change', () => {
    const [result, calls] = mountSub()

    // calls on initial sub
    expect(calls.current).toBe(1)
    expect(result.current).toStrictEqual(baseState)

    useStore.set({})

    // redraws and new state is passed
    expect(calls.current).toBe(2)
    expect(result.current).toStrictEqual(baseState)
    expect(result.current).not.toBe(baseState)
  })

  it('unSub works', () => {
    const [result, calls, unSub] = mountSub()
    expect(calls.current).toBe(1)
    // unSub works
    unSub()
    useStore.set({ blah: true })
    useStore.set({ one: false })
    expect(calls.current).toBe(1)
    expect(result.current).toStrictEqual(baseState)
  })

  it('one selector works', () => {
    const callback = jest.fn()
    const [result, calls] = mountSub(s => s.one, callback)
    expect(result.current).toBe(true)

    // only calls sub when state actually changes
    useStore.set({ two: 5 })
    expect(calls.current).toBe(1)
    useStore.set({ one: true })
    expect(calls.current).toBe(1)
    useStore.set({ one: false })
    expect(calls.current).toBe(2)

    // slice reflects accurate value
    expect(result.current).toBe(false)
  })

  it('array of selectors work', () => {
    const [result, calls] = mountSub([s => s.one, 'hello', 'deep'])
    expect(result.current).toStrictEqual([true, 5, { f: 1 }])

    // only calls sub when one of the slices changes
    useStore.set({ two: 5 })
    expect(calls.current).toBe(1)
    useStore.set({ one: false })
    expect(calls.current).toBe(2)
    expect(result.current).toStrictEqual([false, 5, { f: 1 }])

    // only calls once when multiple slices change at once
    useStore.set({ hello: 10, deep: { b: 2 } })
    expect(result.current).toStrictEqual([false, 10, { f: 1, b: 2 }])
    expect(calls.current).toBe(3)
  })
})
