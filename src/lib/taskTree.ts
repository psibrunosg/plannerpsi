import type { Task } from '@/types'

export interface TaskTreeNode {
  task: Task
  children: TaskTreeNode[]
}

export function buildTaskTree(tasks: Task[]): TaskTreeNode[] {
  const nodes = new Map(tasks.map((task) => [task.id, { task, children: [] as TaskTreeNode[] }]))
  const roots: TaskTreeNode[] = []

  for (const task of tasks) {
    const node = nodes.get(task.id)!
    const parent = task.parent_id ? nodes.get(task.parent_id) : undefined
    if (parent && parent !== node) parent.children.push(node)
    else roots.push(node)
  }

  return roots
}
