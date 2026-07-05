import { useEffect, useMemo, useState } from 'react'
import { FileText, Loader2, Search, X } from 'lucide-react'
import { useStudyStore } from '@/stores/studyStore'
import { fetchMarkdownContent } from '@/lib/drive'
import { studyMedia } from '@/lib/studyMedia'

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function timestampToSeconds(timestamp: string): number {
  const [hh, mm, ss] = timestamp.replace(/[[\]]/g, '').split(':').map(Number)
  return hh * 3600 + mm * 60 + ss
}

function highlightMatches(text: string, query: string) {
  if (!query.trim()) return text
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'))
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    part.toLowerCase() === query.trim().toLowerCase()
      ? <mark key={i} className="bg-accent/40 text-text-primary rounded px-0.5">{part}</mark>
      : part
  )
}

export function StudyTranscript() {
  const activeLesson = useStudyStore(s => s.activeLesson)
  const isAudioMode = useStudyStore(s => s.isAudioMode)
  const [markdown, setMarkdown] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const seekTo = (timestamp: string) => {
    const media = isAudioMode ? studyMedia.audio : studyMedia.video
    media.currentTime = timestampToSeconds(timestamp)
    media.play().catch(() => {})
  }

  useEffect(() => {
    setSearchQuery('')

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

  const matchCount = useMemo(() => {
    if (!markdown || !searchQuery.trim()) return 0
    const re = new RegExp(escapeRegExp(searchQuery.trim()), 'gi')
    return (markdown.match(re) || []).length
  }, [markdown, searchQuery])

  if (!activeLesson) return null

  return (
    <div className="flex h-[400px] xl:h-auto xl:flex-1 flex-col glass-card border border-border-subtle overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-border-subtle bg-surface-hover/30">
        <FileText className="h-4 w-4 text-accent" />
        <h3 className="font-semibold text-text-primary">Transcrição</h3>

        {markdown && (
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar na transcrição..."
                className="w-48 rounded-md bg-surface pl-7 pr-6 py-1 text-xs text-text-primary placeholder:text-text-muted outline-none focus:ring-1 focus:ring-accent"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {searchQuery.trim() && (
              <span className="text-[10px] text-text-muted whitespace-nowrap">{matchCount} resultado{matchCount !== 1 ? 's' : ''}</span>
            )}
          </div>
        )}
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
              if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold text-text-primary mt-4 mb-2">{highlightMatches(line.substring(2), searchQuery)}</h1>
              if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-text-primary mt-3 mb-2">{highlightMatches(line.substring(3), searchQuery)}</h2>
              if (line.startsWith('### ')) return <h3 key={i} className="text-base font-bold text-text-primary mt-2 mb-1">{highlightMatches(line.substring(4), searchQuery)}</h3>
              if (line.trim() === '') return <br key={i} />
              // Highlight timestamps like [00:12:34]
              const parts = line.split(/(\[\d{2}:\d{2}:\d{2}\])/g)
              return (
                <p key={i} className="mb-2 leading-relaxed">
                  {parts.map((part, j) =>
                    part.match(/\[\d{2}:\d{2}:\d{2}\]/)
                      ? (
                        <button
                          key={j}
                          onClick={() => seekTo(part)}
                          title="Pular para este momento"
                          className="text-accent font-mono text-xs mr-1 rounded hover:bg-accent/10 hover:underline transition-colors"
                        >
                          {part}
                        </button>
                      )
                      : <span key={j}>{highlightMatches(part, searchQuery)}</span>
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
