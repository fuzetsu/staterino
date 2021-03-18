const arrEqual = (a, b) => a === b || (a.length === b.length && a.every((val, i) => val === b[i]))
const getPath = (obj, path) => path.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), obj)
const runCallback = (callback, slice, isArr) => callback[isArr ? 'apply' : 'call'](null, slice)

const SELF = x => x

const staterino = ({ merge, hooks: { useReducer, useLayoutEffect }, state: initialState = {} }) => {
  let state = initialState

  const runSelectorPart = part => (typeof part === 'string' ? getPath(state, part) : part(state))
  const runSelector = sel =>
    Array.isArray(sel) ? [sel.map(runSelectorPart), true] : [runSelectorPart(sel), false]

  const runSub = sub => {
    const [slice, isArr] = runSelector(sub._selector)
    if (isArr ? !arrEqual(slice, sub._slice) : slice !== sub._slice) {
      if (typeof sub._cleanup === 'function') sub._cleanup()
      sub._cleanup = runCallback(sub._callback, (sub._slice = slice), isArr)
    }
  }

  const subs = new Set()
  const subscribe = sub => {
    subs.add(sub)
    runSub(sub)
    return () => subs.delete(sub)
  }

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

  useStore.get = () => state
  useStore.set = patch => {
    state = merge(state, patch)
    subs.forEach(runSub)
  }

  useStore.subscribe = (selector, callback) => {
    if (!callback) [selector, callback] = [SELF, selector]
    return subscribe({ _callback: callback, _selector: selector, _slice: [] })
  }

  return useStore
}

export default staterino
