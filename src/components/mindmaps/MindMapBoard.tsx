import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
  ReactFlowProvider
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useMindMapStore } from '@/stores/mindMapStore'
import { MindMapNode } from './MindMapNode'
import { Plus, PaintBucket, Trash2 } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'

function Flow() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, updateNodeColor } = useMindMapStore()
  const theme = useUIStore((s) => s.theme)
  const isDark = theme === 'dark'

  const nodeTypes = useMemo(() => ({ mindmap: MindMapNode }), [])

  const onAddNode = useCallback(() => {
    // Add node slightly offset from center
    addNode({ x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 })
  }, [addNode])

  const onColorSelect = (color: string) => {
    const selectedNodes = nodes.filter(n => n.selected)
    selectedNodes.forEach(node => updateNodeColor(node.id, color))
  }

  const deleteSelected = () => {
    const selectedNodeIds = nodes.filter(n => n.selected).map(n => n.id)
    if (selectedNodeIds.length === 0) return
    const remainingNodes = nodes.filter(n => !selectedNodeIds.includes(n.id))
    const remainingEdges = edges.filter(e => !selectedNodeIds.includes(e.source) && !selectedNodeIds.includes(e.target))
    useMindMapStore.setState({ nodes: remainingNodes, edges: remainingEdges })
  }

  return (
    <div className="flex-1 w-full h-full relative rounded-[var(--radius-md)] overflow-hidden border border-border-subtle bg-surface">
      <ReactFlow
        nodes={nodes.map(n => ({ ...n, type: 'mindmap' }))}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        colorMode={isDark ? 'dark' : 'light'}
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls className="!bg-surface-elevated !border-border-subtle !fill-text-primary" />
        <MiniMap 
          nodeColor={isDark ? '#3E504A' : '#A4C3B2'} 
          maskColor={isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)'}
          className="!bg-surface-elevated !border-border-subtle" 
        />
        
        <Panel position="top-right" className="flex flex-col gap-2 bg-surface-elevated/80 backdrop-blur-md p-2 rounded-lg border border-border-subtle shadow-sm">
          <div className="flex gap-2">
            <button 
              onClick={onAddNode}
              className="p-2 rounded-md bg-accent text-white hover:bg-accent-hover transition-colors flex items-center justify-center gap-1 text-sm font-medium"
              title="Adicionar Nó"
            >
              <Plus className="w-4 h-4" /> Novo Nó
            </button>
            <button 
              onClick={deleteSelected}
              className="p-2 rounded-md bg-surface-hover text-red-500 hover:bg-red-500/20 transition-colors"
              title="Excluir Selecionados (Backspace/Delete)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border-subtle">
            <PaintBucket className="w-4 h-4 text-text-muted mr-1" />
            <button onClick={() => onColorSelect('bg-surface-elevated')} className="w-5 h-5 rounded-full bg-surface-elevated border border-border-subtle hover:scale-110 transition-transform" />
            <button onClick={() => onColorSelect('bg-[#A4C3B2] text-black')} className="w-5 h-5 rounded-full bg-[#A4C3B2] hover:scale-110 transition-transform" />
            <button onClick={() => onColorSelect('bg-[#F0A868] text-black')} className="w-5 h-5 rounded-full bg-[#F0A868] hover:scale-110 transition-transform" />
            <button onClick={() => onColorSelect('bg-[#F4A261] text-black')} className="w-5 h-5 rounded-full bg-[#F4A261] hover:scale-110 transition-transform" />
            <button onClick={() => onColorSelect('bg-[#E76F51] text-white')} className="w-5 h-5 rounded-full bg-[#E76F51] hover:scale-110 transition-transform" />
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}

export function MindMapBoard() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  )
}
