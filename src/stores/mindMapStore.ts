import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react'

import type {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from '@xyflow/react'

export type MindMapNodeData = {
  label: string
  color?: string
}

type MindMapState = {
  nodes: Node<MindMapNodeData>[]
  edges: Edge[]
  onNodesChange: OnNodesChange<Node<MindMapNodeData>>
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  addNode: (position: { x: number, y: number }, data?: Partial<MindMapNodeData>) => void
  updateNodeLabel: (id: string, label: string) => void
  updateNodeColor: (id: string, color: string) => void
}

const initialNodes: Node<MindMapNodeData>[] = [
  {
    id: 'root',
    type: 'default',
    data: { label: 'Nova Ideia / Paciente' },
    position: { x: 250, y: 250 },
  }
]

export const useMindMapStore = create<MindMapState>()(
  persist(
    (set, get) => ({
      nodes: initialNodes,
      edges: [],

      onNodesChange: (changes: NodeChange<Node<MindMapNodeData>>[]) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes) as Node<MindMapNodeData>[],
        })
      },

      onEdgesChange: (changes: EdgeChange[]) => {
        set({
          edges: applyEdgeChanges(changes, get().edges),
        })
      },

      onConnect: (connection: Connection) => {
        set({
          edges: addEdge(connection, get().edges),
        })
      },

      addNode: (position, data) => {
        const id = crypto.randomUUID()
        const newNode: Node<MindMapNodeData> = {
          id,
          position,
          data: { label: data?.label || 'Novo Nó', color: data?.color },
        }
        set({ nodes: [...get().nodes, newNode] })
      },

      updateNodeLabel: (id, label) => {
        set({
          nodes: get().nodes.map((node) =>
            node.id === id ? { ...node, data: { ...node.data, label } } : node
          ),
        })
      },

      updateNodeColor: (id, color) => {
        set({
          nodes: get().nodes.map((node) =>
            node.id === id ? { ...node, data: { ...node.data, color } } : node
          ),
        })
      }
    }),
    {
      name: 'planner-mindmaps-storage',
    }
  )
)
