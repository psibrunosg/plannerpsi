import { useState, useCallback, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  Panel,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type EdgeChange
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ArrowLeft, Plus, Save, Trash2, GripVertical } from 'lucide-react'

import { useProcedureStore } from '@/stores/procedureStore'
import { parseProcedureDesc, parseStepDesc, stringifyProcedureDesc, stringifyStepDesc } from '@/lib/procedureParser'
import type { Procedure, ProcedureStep } from '@/types'
import { cn } from '@/lib/cn'

// Custom Node Component
function StepNode({ data }: { data: { label: string; step: ProcedureStep; onDelete: (id: string) => void } }) {
  return (
    <div className="group relative rounded-xl border border-border-subtle bg-surface px-4 py-3 shadow-lg hover:border-accent transition-colors min-w-[150px]">
      <Handle type="target" position={Position.Top} className="!bg-accent !w-3 !h-3" />
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 shrink-0 text-text-muted opacity-50 cursor-grab active:cursor-grabbing" />
        <div className="font-medium text-sm text-text-primary">{data.label}</div>
      </div>
      {data.step.description && parseStepDesc(data.step.description).text && (
        <div className="mt-1 text-xs text-text-secondary line-clamp-2 pl-6">
          {parseStepDesc(data.step.description).text}
        </div>
      )}
      <button 
        onClick={(e) => { e.stopPropagation(); data.onDelete(data.step.id) }} 
        className="absolute -top-3 -right-3 rounded-full bg-danger text-white p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 shadow-md"
      >
        <Trash2 className="h-3 w-3" />
      </button>
      <Handle type="source" position={Position.Bottom} className="!bg-accent !w-3 !h-3" />
    </div>
  )
}

const nodeTypes = {
  stepNode: StepNode,
}

interface ProcedureFlowProps {
  procedure: Procedure
  onBack: () => void
}

export function ProcedureFlow({ procedure, onBack }: ProcedureFlowProps) {
  const { updateProcedure, addStep, updateStep, deleteStep } = useProcedureStore()
  
  const parsedProc = useMemo(() => parseProcedureDesc(procedure.description), [procedure.description])
  
  // React Flow State
  const [nodes, setNodes, onNodesChangeCore] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChangeCore] = useEdgesState<Edge>([])
  const [isDirty, setIsDirty] = useState(false)

  // Initialize nodes and edges from procedure
  useEffect(() => {
    // Only initialize once on mount or when procedure id changes to avoid overriding un-saved local dragging
    if (nodes.length > 0 && isDirty) return

    const initialNodes: Node[] = procedure.steps.map(step => {
      const parsed = parseStepDesc(step.description)
      return {
        id: step.id,
        type: 'stepNode',
        position: parsed.position || { x: Math.random() * 200, y: Math.random() * 200 },
        data: { label: step.title, step, onDelete: handleDeleteStepNode }
      }
    })

    const initialEdges: Edge[] = parsedProc.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      animated: true,
      style: { stroke: 'var(--color-accent)', strokeWidth: 2 }
    }))

    setNodes(initialNodes)
    setEdges(initialEdges)
    setIsDirty(false)
  }, [procedure.id]) // Re-run if we switch procedures

  const handleDeleteStepNode = useCallback((stepId: string) => {
    deleteStep(procedure.id, stepId)
    setNodes(nds => nds.filter(n => n.id !== stepId))
    setEdges(eds => eds.filter(e => e.source !== stepId && e.target !== stepId))
    setIsDirty(true)
  }, [procedure.id, deleteStep, setNodes, setEdges])

  const onNodesChange = useCallback((changes: NodeChange<Node>[]) => {
    onNodesChangeCore(changes)
    // If it's a position change, we mark dirty
    if (changes.some(c => c.type === 'position')) setIsDirty(true)
  }, [onNodesChangeCore])

  const onEdgesChange = useCallback((changes: EdgeChange<Edge>[]) => {
    onEdgesChangeCore(changes)
    if (changes.some(c => c.type === 'remove' || c.type === 'add')) setIsDirty(true)
  }, [onEdgesChangeCore])

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: 'var(--color-accent)', strokeWidth: 2 } }, eds))
    setIsDirty(true)
  }, [setEdges])

  const handleSaveFlow = async () => {
    // Save all node positions to steps
    for (const node of nodes) {
      const step = procedure.steps.find(s => s.id === node.id)
      if (step) {
        const parsed = parseStepDesc(step.description)
        parsed.position = { x: Math.round(node.position.x), y: Math.round(node.position.y) }
        await updateStep(procedure.id, step.id, { description: stringifyStepDesc(parsed) })
      }
    }

    // Save edges to procedure
    const newParsedProc = {
      ...parsedProc,
      edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target }))
    }
    await updateProcedure(procedure.id, { description: stringifyProcedureDesc(newParsedProc) })
    
    setIsDirty(false)
  }

  const handleAddNode = async () => {
    const newStepTitle = prompt('Nome do novo passo:')
    if (!newStepTitle) return

    const parsedDesc = { text: '', column_id: 'col-todo', position: { x: 100, y: 100 } }
    const newStep: ProcedureStep = {
      id: crypto.randomUUID(),
      title: newStepTitle.trim(),
      description: stringifyStepDesc(parsedDesc),
      order: procedure.steps.length
    }
    
    // We add it to DB first
    await addStep(procedure.id, newStep)

    // Then update local UI
    setNodes(nds => [...nds, {
      id: newStep.id,
      type: 'stepNode',
      position: { x: 100, y: 100 },
      data: { label: newStep.title, step: newStep, onDelete: handleDeleteStepNode }
    }])
  }

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col relative rounded-xl overflow-hidden border border-border-subtle bg-surface-hover/30">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-surface-hover/20"
      >
        <Controls className="!bg-surface !border-border-subtle !fill-text-primary" />
        <MiniMap 
          nodeStrokeColor={() => 'var(--color-accent)'}
          nodeColor={() => 'var(--color-surface)'}
          maskColor="rgba(0, 0, 0, 0.1)"
          className="!bg-surface !border-border-subtle rounded-lg overflow-hidden" 
        />
        <Background gap={12} size={1} color="var(--color-text-muted)" />

        <Panel position="top-left" className="m-4">
          <div className="flex items-center gap-4 bg-surface p-2 rounded-xl shadow-md border border-border-subtle">
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-hover hover:bg-surface-active"
            >
              <ArrowLeft className="h-5 w-5 text-text-primary" />
            </motion.button>
            <div className="pr-4">
              <h1 className="text-lg font-bold text-text-primary">{procedure.name}</h1>
              <p className="text-xs text-text-secondary">{nodes.length} blocos</p>
            </div>
          </div>
        </Panel>

        <Panel position="top-right" className="m-4">
          <div className="flex items-center gap-2">
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              onClick={handleAddNode}
              className="flex items-center gap-2 rounded-lg bg-surface-hover px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-surface-active shadow-md border border-border-subtle"
            >
              <Plus className="h-4 w-4" />
              Novo Bloco
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveFlow}
              disabled={!isDirty}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-md transition-colors",
                isDirty 
                  ? "bg-accent text-white hover:bg-accent-hover" 
                  : "bg-surface-active text-text-muted cursor-not-allowed"
              )}
            >
              <Save className="h-4 w-4" />
              {isDirty ? 'Salvar Alterações' : 'Salvo'}
            </motion.button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}
