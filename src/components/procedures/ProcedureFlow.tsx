import { useState, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type EdgeChange,
  type EdgeProps
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ArrowLeft, Plus, Save, Trash2, GripVertical, Pencil, X } from 'lucide-react'
import { modalOverlay, modalContent } from '@/lib/motion'
import { useScrollLock } from '@/lib/useScrollLock'

import { useProcedureStore } from '@/stores/procedureStore'
import { useUIStore } from '@/stores/uiStore'
import { parseProcedureDesc, parseStepDesc, stringifyProcedureDesc, stringifyStepDesc } from '@/lib/procedureParser'
import type { Procedure, ProcedureStep } from '@/types'
import { cn } from '@/lib/cn'

// Custom Node Component
function StepNode({ data }: { data: { label: string; step: ProcedureStep; onDelete: (id: string) => void; onEdit: (step: ProcedureStep) => void } }) {
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
      
      <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => { e.stopPropagation(); data.onEdit(data.step) }} 
          className="rounded-full bg-accent text-white p-1.5 hover:scale-110 shadow-md transition-transform"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); data.onDelete(data.step.id) }} 
          className="rounded-full bg-danger text-white p-1.5 hover:scale-110 shadow-md transition-transform"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-accent !w-3 !h-3" />
    </div>
  )
}

// Custom Edge Component
function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <button
            className="flex h-5 w-5 items-center justify-center rounded-full bg-surface border border-border-subtle text-text-muted opacity-60 hover:bg-danger hover:text-white hover:border-danger hover:opacity-100 shadow-sm transition-all"
            onClick={(e) => {
              e.stopPropagation()
              const onDelete = data?.onDelete as ((id: string) => void) | undefined
              if (onDelete) onDelete(id)
            }}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const nodeTypes = {
  stepNode: StepNode,
}

const edgeTypes = {
  deletableEdge: DeletableEdge,
}

interface ProcedureFlowProps {
  procedure: Procedure
  onBack: () => void
}

export function ProcedureFlow({ procedure, onBack }: ProcedureFlowProps) {
  const { updateProcedure, addStep, updateStep, deleteStep } = useProcedureStore()
  const theme = useUIStore(s => s.theme)
  
  const parsedProc = useMemo(() => parseProcedureDesc(procedure.description), [procedure.description])
  
  // React Flow State
  const [nodes, setNodes, onNodesChangeCore] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChangeCore] = useEdgesState<Edge>([])
  const [isDirty, setIsDirty] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editingStep, setEditingStep] = useState<ProcedureStep | null>(null)
  useScrollLock(!!editingStep)

  const handleDeleteStepNode = useCallback((stepId: string) => {
    deleteStep(procedure.id, stepId)
    setNodes(nds => nds.filter(n => n.id !== stepId))
    setEdges(eds => eds.filter(e => e.source !== stepId && e.target !== stepId))
    setIsDirty(true)
  }, [procedure.id, deleteStep, setNodes, setEdges])

  const handleEditStepNode = useCallback((step: ProcedureStep) => {
    setEditingStep(step)
  }, [])

  const handleDeleteEdge = useCallback((edgeId: string) => {
    setEdges(eds => eds.filter(e => e.id !== edgeId))
    setIsDirty(true)
  }, [setEdges])

  // Initialize nodes and edges from procedure
  useEffect(() => {
    // Only initialize once on mount or when procedure id changes to avoid overriding un-saved local dragging
    if (isDirty) return

    const initialNodes: Node[] = procedure.steps.map(step => {
      const parsed = parseStepDesc(step.description)
      return {
        id: step.id,
        type: 'stepNode',
        position: (parsed.position && (parsed.position.x !== 0 || parsed.position.y !== 0)) 
          ? parsed.position 
          : { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
        data: { label: step.title, step, onDelete: handleDeleteStepNode, onEdit: handleEditStepNode },
        className: "!bg-transparent !border-none !shadow-none !p-0"
      }
    })

    const initialEdges: Edge[] = parsedProc.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'deletableEdge',
      animated: true,
      style: { stroke: 'var(--accent)', strokeWidth: 2 },
      data: { onDelete: handleDeleteEdge }
    }))

    setNodes(initialNodes)
    setEdges(initialEdges)
    // We do NOT set isDirty(false) here because if we are just re-syncing from DB, we are already clean.
  }, [procedure.id, procedure.steps, parsedProc.edges, setNodes, setEdges, handleDeleteStepNode, handleEditStepNode, handleDeleteEdge, isDirty])

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
    setEdges((eds) => addEdge({ 
      ...params, 
      type: 'deletableEdge',
      animated: true, 
      style: { stroke: 'var(--accent)', strokeWidth: 2 },
      data: { onDelete: handleDeleteEdge }
    }, eds))
    setIsDirty(true)
  }, [setEdges, handleDeleteEdge])

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

  const handleSaveNewNode = async (title: string, desc: string) => {
    const parsedDesc = { 
      text: desc, 
      column_id: 'col-todo', 
      position: { x: 100 + Math.random() * 50, y: 100 + Math.random() * 50 } 
    }
    const newStep: ProcedureStep = {
      id: crypto.randomUUID(),
      title: title,
      description: stringifyStepDesc(parsedDesc),
      order: procedure.steps.length
    }
    
    await addStep(procedure.id, newStep)
    setNodes(nds => [...nds, {
      id: newStep.id,
      type: 'stepNode',
      position: parsedDesc.position,
      data: { label: newStep.title, step: newStep, onDelete: handleDeleteStepNode, onEdit: handleEditStepNode },
      className: "!bg-transparent !border-none !shadow-none !p-0"
    }])
    setIsCreating(false)
  }

  const handleSaveEditNode = async (title: string, desc: string) => {
    if (!editingStep) return
    const parsed = parseStepDesc(editingStep.description)
    parsed.text = desc
    const updatedStep = { ...editingStep, title, description: stringifyStepDesc(parsed) }
    
    await updateStep(procedure.id, editingStep.id, { title, description: stringifyStepDesc(parsed) })
    
    setNodes(nds => nds.map(n => n.id === editingStep.id ? {
      ...n,
      data: { ...n.data, label: title, step: updatedStep }
    } : n))
    
    setEditingStep(null)
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
        edgeTypes={edgeTypes}
        fitView
        colorMode={theme}
        className="bg-surface-hover/20"
      >
        <Controls 
          className="!bg-surface !border-border-subtle !fill-text-primary overflow-hidden rounded-lg shadow-md" 
        />
        <MiniMap 
          nodeStrokeColor={() => 'var(--accent)'}
          nodeColor={() => 'var(--surface-active)'}
          maskColor="var(--glass-bg)"
          className="!bg-surface !border-border-subtle rounded-lg overflow-hidden shadow-lg" 
        />
        <Background gap={12} size={1} color="var(--text-muted)" />

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
              onClick={() => setIsCreating(true)}
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

      <AnimatePresence>
        {(isCreating || editingStep) && (
          <BlockModal
            initialTitle={editingStep ? editingStep.title : ''}
            initialDesc={editingStep ? parseStepDesc(editingStep.description).text : ''}
            onClose={() => {
              setIsCreating(false)
              setEditingStep(null)
            }}
            onSave={(title, desc) => {
              if (isCreating) handleSaveNewNode(title, desc)
              else if (editingStep) handleSaveEditNode(title, desc)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function BlockModal({ 
  initialTitle = '', 
  initialDesc = '', 
  onClose, 
  onSave 
}: { 
  initialTitle?: string, 
  initialDesc?: string, 
  onClose: () => void, 
  onSave: (title: string, desc: string) => void 
}) {
  const [title, setTitle] = useState(initialTitle)
  const [desc, setDesc] = useState(initialDesc)

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" variants={modalOverlay} initial="hidden" animate="visible" exit="exit">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div className="glass relative w-full max-w-md overflow-hidden rounded-[var(--radius-lg)] shadow-2xl" variants={modalContent} initial="hidden" animate="visible" exit="exit">
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <h2 className="text-lg font-semibold text-text-primary">{initialTitle ? 'Editar Bloco' : 'Novo Bloco'}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <input 
            autoFocus 
            type="text" 
            placeholder="Nome do bloco..." 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            className="w-full bg-transparent text-lg font-medium text-text-primary placeholder:text-text-muted outline-none border-b border-border-subtle pb-2 focus:border-accent transition-colors" 
          />
          <textarea 
            placeholder="Descrição detalhada (opcional)..." 
            value={desc} 
            onChange={(e) => setDesc(e.target.value)} 
            rows={3} 
            className="w-full resize-none rounded-[var(--radius-sm)] bg-surface-hover px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-1 focus:ring-accent" 
          />
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="rounded-[var(--radius-sm)] px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover">Cancelar</button>
            <button 
              onClick={() => onSave(title.trim(), desc.trim())} 
              disabled={!title.trim()} 
              className={cn('rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium text-white transition-colors', title.trim() ? 'bg-accent hover:bg-accent-hover' : 'bg-accent/40 cursor-not-allowed')}
            >
              Salvar
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
