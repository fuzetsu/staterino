const arrEqual = (a, b) => a === b || (a.length === b.length && a.every((val, i) => val === b[i]))
const getPath = (obj, path) => path.split('.').reduce((acc, k) => (acc ? acc[k] : null), obj)
const runCallback = (callback, slice, isArr) => callback[isArr ? 'apply' : 'call'](null, slice)

const SELF = x => x

const createStore = ({ merge, hooks: { useReducer, useRef, useLayoutEffect }, state = {} }) => {
  // track subs using set
  const subs = new Set()
  const subscribe = sub => (subs.add(sub), () => subs.delete(sub))

  // evaluate selectors
  const runSelectorPart = part => (typeof part === 'string' ? getPath(state, part) : part(state))
  const runSelector = sel =>
    Array.isArray(sel) ? [sel.map(runSelectorPart), true] : [runSelectorPart(sel), false]

  // main hook, manages subscription and returns slice
  const useStore = (selector = SELF) => {
    const [, redraw] = useReducer(c => c + 1, 0)
    const sub = useRef({ callback: redraw }).current
    const sameSel =
      sub.selector &&
      (Array.isArray(selector) ? arrEqual(selector, sub.selector) : selector === sub.selector)
    if (!sameSel) {
      sub.slice = runSelector(selector)[0]
      sub.selector = selector
    }
    useLayoutEffect(() => subscribe(sub), [])
    return sub.slice
  }

  // getter / setter for state, setter uses mergerino for immutable merges
  useStore.get = () => state
  useStore.set = (...patches) => {
    state = merge(state, patches)
    // when state is patched check if each subs slice of state has changed, and callback if so
    subs.forEach(sub => {
      const [slice, isArr] = runSelector(sub.selector)
      if (isArr ? !arrEqual(slice, sub.slice) : slice !== sub.slice)
        runCallback(sub.callback, (sub.slice = slice), isArr)
    })
  }

  // external subscription
  useStore.subscribe = (callback, selector = SELF) => {
    const [slice, isArr] = runSelector(selector)
    runCallback(callback, slice, isArr)
    return subscribe({ callback, selector, slice })
  }

  return useStore
}

export default createStore
