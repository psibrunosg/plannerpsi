import { beforeEach, describe, expect, it } from 'vitest'
import { useFocusStore } from './focusStore'

describe('focusStore.startSession', () => {
  beforeEach(() => {
    useFocusStore.setState({ activeSession: null })
  })

  it('inicia Pomodoro vinculado à tarefa com a duração configurada', () => {
    useFocusStore.getState().startSession('task-123', 'pomodoro', 25)

    expect(useFocusStore.getState().activeSession).toMatchObject({
      taskId: 'task-123',
      type: 'pomodoro',
      duration: 1500,
      remaining: 1500,
      isPaused: false,
    })
  })

  it('aceita sessão sem tarefa para preservar os demais fluxos de foco', () => {
    useFocusStore.getState().startSession(null, 'deep_work', 40)

    expect(useFocusStore.getState().activeSession).toMatchObject({
      taskId: null,
      type: 'deep_work',
      duration: 2400,
      remaining: 2400,
    })
  })
})
