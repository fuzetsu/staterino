# Staterino

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

// reset count when it reaches 11
subscribe(
  count => {
    if (count > 10) set({ count: 0 })
  },
  s => s.count
)

const App = () => {
  const count = useStore(s => s.count)
  return (
    <div>
      <p>Count is {count}</p>
      <button onclick={increment}>+</button>
    </div>
  )
}

render(document.body, <App />)
```

## Credits

Inspired by [zustand](https://github.com/react-spring/zustand) ❤️
