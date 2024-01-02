import { TransitionPresets, useTransition } from '@vueuse/core'
import type { UnwrapNestedRefs } from 'vue'

export function useProgress(data = { completed: 0, message: '', total: 0 }) {
  const completed = ref(data.completed)
  const message = ref(data.message)
  const total = ref(data.total)
  const add = (n = 1) => {
    completed.value += n
  }
  const addTotal = (n = 1) => {
    total.value += n
  }
  const completedOutput = useTransition(completed, {
    duration: 3000,
    transition: TransitionPresets.easeOutExpo,
  })
  const totalOutput = useTransition(total, {
    duration: 1500,
    transition: TransitionPresets.easeOutExpo,
  })
  return {
    add,
    addTotal,
    completed,
    completedOutput,
    message,
    total,
    totalOutput,
  }
}

export type ProgressR = ReturnType<typeof useProgress>
export type Progress = UnwrapNestedRefs<ProgressR>
