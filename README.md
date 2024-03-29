# Staterino [![npm](https://img.shields.io/npm/v/staterino.svg)](https://www.npmjs.com/package/staterino) [![size](https://img.shields.io/bundlephobia/minzip/staterino)](https://unpkg.com/staterino@latest/dist/staterino.min.js)

Simple hook based state management.

## Example

```jsx
import { render } from 'preact'
import * as hooks from 'preact/hooks'
import merge from 'mergerino'
import staterino from 'staterino'

const state = { count: 0 }

const useStore = staterino({ merge, hooks, state })

const { set, get, subscribe } = useStore
const increment = () => set({ count: x => x + 1 })
const decrement = () => set({ count: x => x - 1 })

// reset count when it reaches 11
subscribe(
  s => s.count,
  count => {
    if (Math.abs(count) > 10) set({ count: 0 })
  }
)

const App = () => {
  const count = useStore(s => s.count)
  return (
    <div>
      <p>Count is {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  )
}

render(<App />, document.getElementById('app'))
```

[Code sandbox](https://codesandbox.io/s/staterino-example-f0de8?file=/src/index.js)

## Usage

Staterino exports a single function: `staterino`.

This function creates a staterino data store, it expects a single object of the following shape as its only parameter:

```js
const useStore = staterino({
  // initial state object
  state,
  // reducer function that combines current state with a patch
  merge,
  // staterino relies on these two hooks to function
  hooks: { useLayoutEffect, useReducer }
})
```

You can create as many data stores as you like, each holding their own isolated state.

`useStore` accepts one parameter, a state selector.

A state selector can be either a function:

```js
const count = useStore(state => state.counter.count)
```

a string:

```js
const count = useStore('counter.count')
```

or an array of strings/functions:

```js
const [count, age] = useStore(['counter.count', state => state.age])
```

If you pass an array the hook will return an array as well with the state slices in the correct order.

If no arguments are passed `useStore()` will return the whole state object:

```js
const state = useStore()
```

`useStore` is the hook itself, but it contains 3 essential functions:

```js
const {
  // sends a patch to be merged with the current state
  set,
  // getter for current state
  get,
  // allows you to react to state changes outside of components
  subscribe
} = useStore
```

`subscribe` takes two parameters, a state selector or array of state selectors, and a callback for when the subscribed portion of state changes:

```js
// the subscribe call returns a function used to unsubscribe
const unSub = subscribe(
  // the state selector
  ['counter.count', state => state.age],
  // the callback function that triggers when state changes
  (count, age) => {
    console.log(count, age)
    // optional cleanup function, similar to useEffect
    return () => console.log('cleaning up', count, age)
  }
)
```

The selector parameter works under the same rules as the one passed to `useStore`, it can be a string a function or an array with a mix of the two.

If you just want to subscribe to any change to the state overall you can just pass a single parameter as a shorthand:

```js
subscribe(state => {
  // do something whenever state changes
})
```

## Credits

Inspired by [zustand](https://github.com/react-spring/zustand) ❤️
