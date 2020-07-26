const arrEqual = (a, b) => a === b || (a.length === b.length && a.every((val, i) => val === b[i]))
const getPath = (obj, path) => path.split('.').reduce((acc, k) => (acc ? acc[k] : null), obj)
const runCallback = (callback, slice, isArr) => callback[isArr ? 'apply' : 'call'](null, slice)

const SELF = x => x

const staterino = ({ merge, hooks: { useReducer, useLayoutEffect }, state = {} }) => {
  // evaluate selectors
  const runSelectorPart = part => (typeof part === 'string' ? getPath(state, part) : part(state))
  const runSelector = sel =>
    Array.isArray(sel) ? [sel.map(runSelectorPart), true] : [runSelectorPart(sel), false]

  const checkSub = sub => {
    const [slice, isArr] = runSelector(sub._selector)
    if (isArr ? !arrEqual(slice, sub._slice) : slice !== sub._slice)
      runCallback(sub._callback, (sub._slice = slice), isArr)
  }

  // track subs using set
  const subs = new Set()
  const subscribe = sub => {
    subs.add(sub)
    checkSub(sub)
    return () => subs.delete(sub)
  }

  // main hook, manages subscription and returns slice
  const useStore = (selector = SELF) => {
    const [, redraw] = useReducer(c => c + 1, 0)
    const [sub] = useReducer(SELF, { _callback: redraw })
    const sameSel =
      sub._selector &&
      (Array.isArray(selector) ? arrEqual(selector, sub._selector) : selector === sub._selector)
    if (!sameSel) {
      sub._slice = runSelector(selector)[0]
      sub._selector = selector
    }
    useLayoutEffect(() => subscribe(sub), [])
    return sub._slice
  }

  // getter / setter for state, setter uses mergerino for immutable merges
  useStore.get = () => state
  useStore.set = (...patches) => {
    state = merge(state, patches)
    // when state is patched check if each subs slice of state has changed, and callback if so
    subs.forEach(checkSub)
  }

  // external subscription, pass empty arr as slice to force callback to be called on first run
  useStore.subscribe = (callback, selector = SELF) =>
    subscribe({ _callback: callback, _selector: selector, _slice: [] })

  return useStore
}

export default staterino
