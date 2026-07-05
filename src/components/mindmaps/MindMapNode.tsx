import { useState, useRef, useEffect } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { useMindMapStore } from '@/stores/mindMapStore'
import { cn } from '@/lib/cn'

export function MindMapNode({ id, data, selected }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [label, setLabel] = useState(data.label as string)
  const inputRef = useRef<HTMLInputElement>(null)
  const updateNodeLabel = useMindMapStore((s) => s.updateNodeLabel)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const handleBlur = () => {
    setIsEditing(false)
    if (label.trim()) {
      updateNodeLabel(id, label)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur()
    }
  }

  const colorClass = data.color ? data.color : 'bg-surface-elevated border-border-subtle'

  return (
    <div 
      className={cn(
        "px-4 py-2 shadow-sm rounded-[var(--radius-md)] border-2 transition-colors min-w-[120px] text-center",
        colorClass,
        selected ? 'border-accent ring-2 ring-accent/20' : 'border-border-subtle hover:border-text-muted',
        "text-text-primary text-sm font-medium"
      )}
      onDoubleClick={() => setIsEditing(true)}
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-accent" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-accent" />
      <Handle type="target" position={Position.Left} id="left" className="w-2 h-2 !bg-accent" />
      <Handle type="source" position={Position.Right} id="right" className="w-2 h-2 !bg-accent" />
      
      {isEditing ? (
        <input
          ref={inputRef}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent outline-none text-center nodrag"
        />
      ) : (
        <div className="select-none">{label}</div>
      )}
    </div>
  )
}
