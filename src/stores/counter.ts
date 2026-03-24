import { defineStore } from 'pinia'

type CounterState = {
  count: number
}

export const useCounterStore = defineStore('counter', {
  state: (): CounterState => ({
    count: 1,
  }),
  actions: {
    increment() {
      this.count += 1
    },
  },
})
