# Staterino [![npm](https://img.shields.io/npm/v/staterino.svg)](https://www.npmjs.com/package/staterino) [![size](https://img.badgesize.io/https://unpkg.com/staterino@latest/dist/staterino.min.js.png?label=gzip&color=blue&compression=gzip)](https://unpkg.com/staterino@latest/dist/staterino.min.js)

Simple hook based state management.

## Usage

```jsx
import * as hooks from 'preact/hooks'
import { render } from 'preact'
import merge from 'mergerino'
import staterino from 'staterino'

const state = {
  count: 0
}

const useStore = staterino({ merge, hooks, state })

const { set, get, subscribe } = useStore
const increment = () => set({ count: x => x + 1 })
const decrement = () => set({ count: x => x - 1 })

// reset count when it reaches 11
subscribe(
  count => {
    if (Math.abs(count) > 10) set({ count: 0 })
  },
  s => s.count
)

const App = () => {
  const count = useStore(s => s.count)
  return (
    <div>
      <p>Count is {count}</p>
      <button onclick={increment}>+</button>
      <button onclick={decrement}>-</button>
    </div>
  )
}

render(<App />, document.getElementById('app'))
```

[Code sandbox](https://codesandbox.io/s/staterino-example-f0de8?file=/src/index.js)

## Credits

Inspired by [zustand](https://github.com/react-spring/zustand) ❤️
