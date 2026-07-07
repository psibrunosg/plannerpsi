import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { Bold, Italic, List, ListOrdered, CheckSquare, Heading1, Heading2, Quote } from 'lucide-react'
import { useEffect } from 'react'

interface NotionEditorProps {
  content: string
  onChange: (content: string) => void
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border-subtle bg-surface-elevated/50 p-2">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn('p-1.5 rounded-md hover:bg-surface-hover transition-colors', editor.isActive('bold') && 'bg-accent/20 text-accent')}
        title="Negrito"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn('p-1.5 rounded-md hover:bg-surface-hover transition-colors', editor.isActive('italic') && 'bg-accent/20 text-accent')}
        title="Itálico"
      >
        <Italic className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-border-subtle mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={cn('p-1.5 rounded-md hover:bg-surface-hover transition-colors', editor.isActive('heading', { level: 1 }) && 'bg-accent/20 text-accent')}
        title="Título 1"
      >
        <Heading1 className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn('p-1.5 rounded-md hover:bg-surface-hover transition-colors', editor.isActive('heading', { level: 2 }) && 'bg-accent/20 text-accent')}
        title="Título 2"
      >
        <Heading2 className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-border-subtle mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn('p-1.5 rounded-md hover:bg-surface-hover transition-colors', editor.isActive('bulletList') && 'bg-accent/20 text-accent')}
        title="Lista de Marcadores"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn('p-1.5 rounded-md hover:bg-surface-hover transition-colors', editor.isActive('orderedList') && 'bg-accent/20 text-accent')}
        title="Lista Numerada"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={cn('p-1.5 rounded-md hover:bg-surface-hover transition-colors', editor.isActive('taskList') && 'bg-accent/20 text-accent')}
        title="Lista de Tarefas"
      >
        <CheckSquare className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-border-subtle mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn('p-1.5 rounded-md hover:bg-surface-hover transition-colors', editor.isActive('blockquote') && 'bg-accent/20 text-accent')}
        title="Citação"
      >
        <Quote className="w-4 h-4" />
      </button>
    </div>
  )
}

export function NotionEditor({ content, onChange }: NotionEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder: 'Comece a digitar suas anotações aqui...',
      }),
    ],
    content,
    onUpdate: ({ editor }: { editor: any }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4 font-body leading-relaxed text-text-primary',
      },
    },
  })

  // Sincroniza quando o conteúdo inicial muda externamente (ex: trocar de aula)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-border-subtle"
    >
      <MenuBar editor={editor} />
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-surface/50">
        <EditorContent editor={editor} />
      </div>
    </motion.div>
  )
}
