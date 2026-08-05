import { describe, expect, it } from 'vitest'
import { buildTaskTree } from '@/lib/taskTree'
import type { Task } from '@/types'

const task = (id: string, parent_id: string | null = null): Task => ({
  id, parent_id, title: id, description: null, status: 'todo', priority: 'p3',
  due_date: null, due_time: null, reminder_minutes: null, estimated_minutes: null,
  actual_minutes: null, tags: [], is_recurring: false, recurrence_rule: null,
  completed_at: null, position: 0, kanban_column: 'todo', completion_percentage: 0,
  created_at: '', updated_at: '', user_id: null, assignee_id: null,
})

describe('buildTaskTree', () => {
  it('aninha subtarefas abaixo da tarefa principal sem perder a ordem', () => {
    const tree = buildTaskTree([task('principal'), task('sub-1', 'principal'), task('sub-2', 'principal'), task('avulsa')])

    expect(tree.map((node) => node.task.id)).toEqual(['principal', 'avulsa'])
    expect(tree[0].children.map((node) => node.task.id)).toEqual(['sub-1', 'sub-2'])
  })
})
