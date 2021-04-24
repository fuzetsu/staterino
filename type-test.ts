import staterino from 'staterino'

interface State {
  book: boolean
  house: number
  nested: {
    hi: number
  }
}

const initialState: State = {
  book: true,
  house: 10,
  nested: {
    hi: 3
  }
}

const useStore = staterino<State>({
  state: initialState,
  hooks: { useLayoutEffect: true, useReducer: true },
  merge: () => null
})

const val = useStore(s => s.house)

const [blah, house, hi] = useStore(['hi', s => s.house, s => s.nested.hi])

useStore.subscribe(
  s => s.book,
  book => console.log(book)
)

useStore.subscribe([s => s.house, s => s.nested.hi], (house, hi) => {})
useStore.subscribe(s => {})
useStore.subscribe([s => s.book, 'hello'], (book, h) => {})

useStore.set([{ book: true }, { nested: {} }, s => s, [[[{ house: 3 }]]]])

const s = useStore()
