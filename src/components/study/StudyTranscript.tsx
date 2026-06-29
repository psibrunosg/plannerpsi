import { useEffect, useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { useStudyStore } from '@/stores/studyStore'
import { fetchMarkdownContent } from '@/lib/drive'

export function StudyTranscript() {
  const activeLesson = useStudyStore(s => s.activeLesson)
  const [markdown, setMarkdown] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!activeLesson || !activeLesson.transcriptFile) {
      setMarkdown(null)
      return
    }

    let isMounted = true
    setLoading(true)
    setMarkdown(null)
    
    fetchMarkdownContent(activeLesson.transcriptFile.id)
      .then(content => {
        if (isMounted) {
          setMarkdown(content)
          setLoading(false)
        }
      })
      .catch(err => {
        if (isMounted) {
          setMarkdown('Erro ao carregar a transcrição.')
          console.error(err)
          setLoading(false)
        }
      })
      
    return () => { isMounted = false }
  }, [activeLesson])

  if (!activeLesson) return null

  return (
    <div className="flex h-[400px] xl:h-auto xl:flex-1 flex-col glass-card border border-border-subtle overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-border-subtle bg-surface-hover/30">
        <FileText className="h-4 w-4 text-accent" />
        <h3 className="font-semibold text-text-primary">Transcrição</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
        {loading ? (
          <div className="flex h-full items-center justify-center text-text-muted">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando texto...
          </div>
        ) : !activeLesson.transcriptFile ? (
          <div className="flex h-full flex-col items-center justify-center text-text-muted text-center italic">
            <FileText className="mb-2 h-8 w-8 opacity-20" />
            <p>Nenhuma transcrição disponível para esta aula.</p>
          </div>
        ) : markdown ? (
          <div className="prose prose-sm prose-invert max-w-none text-text-secondary">
            {/* Simple markdown parsing for the transcript */}
            {markdown.split('\n').map((line, i) => {
              if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold text-text-primary mt-4 mb-2">{line.substring(2)}</h1>
              if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-text-primary mt-3 mb-2">{line.substring(3)}</h2>
              if (line.startsWith('### ')) return <h3 key={i} className="text-base font-bold text-text-primary mt-2 mb-1">{line.substring(4)}</h3>
              if (line.trim() === '') return <br key={i} />
              // Highlight timestamps like [00:12:34]
              const parts = line.split(/(\[\d{2}:\d{2}:\d{2}\])/g)
              return (
                <p key={i} className="mb-2 leading-relaxed">
                  {parts.map((part, j) => 
                    part.match(/\[\d{2}:\d{2}:\d{2}\]/) 
                      ? <span key={j} className="text-accent font-mono text-xs mr-1">{part}</span> 
                      : <span key={j}>{part}</span>
                  )}
                </p>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}
