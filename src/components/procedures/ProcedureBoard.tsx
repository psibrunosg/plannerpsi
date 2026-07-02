import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, GripVertical, ArrowLeft } from 'lucide-react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { useProcedureStore } from '@/stores/procedureStore'
import { useToastStore } from '@/stores/toastStore'
import { parseProcedureDesc, parseStepDesc, stringifyProcedureDesc, stringifyStepDesc } from '@/lib/procedureParser'
import type { Procedure, ProcedureStep, ProcedureColumn } from '@/types'
import { cn } from '@/lib/cn'

interface ProcedureBoardProps {
  procedure: Procedure
  onBack: () => void
}

export function ProcedureBoard({ procedure, onBack }: ProcedureBoardProps) {
  const { updateProcedure, addStep, deleteStep, reorderSteps } = useProcedureStore()
  const addToast = useToastStore((s) => s.addToast)

  // Parse Kanban structure from descriptions
  const parsedProc = useMemo(() => parseProcedureDesc(procedure.description), [procedure.description])
  const columns = parsedProc.columns

  // Map steps to parsed objects
  const stepsByColumn = useMemo(() => {
    const map = new Map<string, (ProcedureStep & { parsed: any })[]>()
    columns.forEach(c => map.set(c.id, []))
    
    // Fallback for steps without a valid column
    const defaultCol = columns[0]?.id || 'col-todo'

    // Sort by order first
    const sortedSteps = [...procedure.steps].sort((a, b) => a.order - b.order)

    sortedSteps.forEach(step => {
      const parsed = parseStepDesc(step.description, defaultCol)
      // Ensure column exists, else use default
      const colId = map.has(parsed.column_id) ? parsed.column_id : defaultCol
      map.get(colId)!.push({ ...step, parsed })
    })

    return map
  }, [procedure.steps, columns])

  const [addingCol, setAddingCol] = useState(false)
  const [newColTitle, setNewColTitle] = useState('')
  const [addingStepCol, setAddingStepCol] = useState<string | null>(null)
  const [newStepTitle, setNewStepTitle] = useState('')

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const { source, destination } = result

    const sourceColId = source.droppableId
    const destColId = destination.droppableId

    if (sourceColId === destColId && source.index === destination.index) return

    const sourceList = Array.from(stepsByColumn.get(sourceColId) || [])
    const destList = sourceColId === destColId ? sourceList : Array.from(stepsByColumn.get(destColId) || [])

    const [movedStep] = sourceList.splice(source.index, 1)

    // Update the column_id in the moved step's description
    const updatedParsedDesc = { ...movedStep.parsed, column_id: destColId }
    movedStep.description = stringifyStepDesc(updatedParsedDesc)
    movedStep.parsed = updatedParsedDesc

    destList.splice(destination.index, 0, movedStep)

    // We need to flatten and update order for all steps
    // To minimize DB calls, we only update order of affected columns, but since order is global in DB,
    // we should just recalculate order for ALL steps.
    const allLists = Array.from(stepsByColumn.entries())
    let globalOrder = 0
    const allStepsFlat: ProcedureStep[] = []

    for (const [colId, list] of allLists) {
      const targetList = colId === sourceColId ? sourceList : colId === destColId ? destList : list
      for (const step of targetList) {
        // Strip out 'parsed' before saving
        const { parsed, ...pureStep } = step as any
        allStepsFlat.push({ ...pureStep, order: globalOrder++ })
      }
    }

    // Optimistically update
    await reorderSteps(procedure.id, allStepsFlat)
  }

  const handleAddColumn = async () => {
    if (!newColTitle.trim()) return
    const newCol: ProcedureColumn = {
      id: `col-${crypto.randomUUID()}`,
      title: newColTitle.trim(),
      order: columns.length
    }
    const updatedParsedProc = { ...parsedProc, columns: [...columns, newCol] }
    
    await updateProcedure(procedure.id, { description: stringifyProcedureDesc(updatedParsedProc) })
    setAddingCol(false)
    setNewColTitle('')
  }

  const handleRemoveColumn = async (colId: string) => {
    if (columns.length <= 1) {
      addToast('Não é possível remover a última coluna', 'error')
      return
    }
    const stepsInCol = stepsByColumn.get(colId) || []
    if (stepsInCol.length > 0) {
      addToast('Mova ou exclua os itens antes de remover a coluna', 'error')
      return
    }
    const updatedColumns = columns.filter(c => c.id !== colId)
    const updatedParsedProc = { ...parsedProc, columns: updatedColumns }
    await updateProcedure(procedure.id, { description: stringifyProcedureDesc(updatedParsedProc) })
  }

  const handleAddStep = async (colId: string) => {
    if (!newStepTitle.trim()) return
    
    const parsedDesc = { text: '', column_id: colId, position: { x: 100, y: 100 } }
    const newStep: ProcedureStep = {
      id: crypto.randomUUID(),
      title: newStepTitle.trim(),
      description: stringifyStepDesc(parsedDesc),
      order: procedure.steps.length
    }
    
    await addStep(procedure.id, newStep)
    setAddingStepCol(null)
    setNewStepTitle('')
  }

  const handleDeleteStep = async (stepId: string) => {
    await deleteStep(procedure.id, stepId)
  }

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-surface-hover hover:bg-surface-active"
          >
            <ArrowLeft className="h-5 w-5 text-text-primary" />
          </motion.button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{procedure.name}</h1>
            <p className="text-sm text-text-secondary">{parsedProc.text || 'Nenhuma descrição'}</p>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex h-full items-start gap-6 px-1">
            {columns.map(col => (
              <div key={col.id} className="flex h-full max-h-full w-[300px] shrink-0 flex-col rounded-xl bg-surface-hover/50 border border-border-subtle p-3">
                <div className="mb-4 flex items-center justify-between px-1">
                  <h3 className="font-semibold text-text-primary">{col.title}</h3>
                  <div className="flex items-center gap-1">
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-surface-active px-1.5 text-xs font-medium text-text-muted">
                      {(stepsByColumn.get(col.id) || []).length}
                    </span>
                    <button onClick={() => handleRemoveColumn(col.id)} className="text-text-muted hover:text-danger p-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex-1 overflow-y-auto overflow-x-hidden p-1 min-h-[50px] transition-colors rounded-lg",
                        snapshot.isDraggingOver ? 'bg-surface-active/30' : ''
                      )}
                    >
                      {(stepsByColumn.get(col.id) || []).map((step, index) => (
                        <Draggable key={step.id} draggableId={step.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "group mb-2 flex items-start gap-2 rounded-lg border bg-surface p-3 shadow-sm transition-all",
                                snapshot.isDragging ? 'border-accent shadow-lg z-50 rotate-2' : 'border-border-subtle hover:border-accent/30'
                              )}
                            >
                              <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-50" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text-primary">{step.title}</p>
                                {step.parsed.text && (
                                  <p className="mt-1 text-xs text-text-secondary line-clamp-2">{step.parsed.text}</p>
                                )}
                              </div>
                              <button onClick={() => handleDeleteStep(step.id)} className="shrink-0 p-1 text-text-muted opacity-0 hover:text-danger group-hover:opacity-100 transition-opacity">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {/* Add Step Button inside Column */}
                {addingStepCol === col.id ? (
                  <div className="mt-2 rounded-lg bg-surface p-2 shadow-sm border border-accent">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Nome do passo..."
                      value={newStepTitle}
                      onChange={(e) => setNewStepTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddStep(col.id)
                        if (e.key === 'Escape') setAddingStepCol(null)
                      }}
                      className="w-full bg-transparent text-sm text-text-primary outline-none"
                    />
                    <div className="mt-2 flex gap-1">
                      <button onClick={() => handleAddStep(col.id)} className="rounded bg-accent px-2 py-1 text-xs font-medium text-white hover:bg-accent-hover">Adicionar</button>
                      <button onClick={() => setAddingStepCol(null)} className="rounded px-2 py-1 text-xs text-text-muted hover:bg-surface-hover">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingStepCol(col.id)}
                    className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-text-muted hover:bg-surface hover:text-text-primary transition-colors"
                  >
                    <Plus className="h-4 w-4" /> Adicionar tarefa
                  </button>
                )}
              </div>
            ))}

            {/* Add Column Button */}
            <div className="w-[300px] shrink-0">
              {addingCol ? (
                <div className="rounded-xl border border-border-subtle bg-surface p-3 shadow-sm">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Nome do grupo..."
                    value={newColTitle}
                    onChange={(e) => setNewColTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddColumn()
                      if (e.key === 'Escape') setAddingCol(false)
                    }}
                    className="w-full bg-transparent text-sm font-medium text-text-primary outline-none"
                  />
                  <div className="mt-2 flex gap-1">
                    <button onClick={handleAddColumn} className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover">Salvar</button>
                    <button onClick={() => setAddingCol(false)} className="rounded px-3 py-1.5 text-xs text-text-muted hover:bg-surface-hover">Cancelar</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingCol(true)}
                  className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border-subtle bg-surface-hover/30 p-3 text-sm font-medium text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors"
                >
                  <Plus className="h-4 w-4" /> Adicionar grupo
                </button>
              )}
            </div>
          </div>
        </DragDropContext>
      </div>
    </div>
  )
}
