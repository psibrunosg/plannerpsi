import { useEffect } from 'react'
import { Folder, PlayCircle, Loader2, AlertCircle } from 'lucide-react'
import { useStudyStore } from '@/stores/studyStore'
import { cn } from '@/lib/cn'

export function StudySidebar() {
  const { 
    modules, 
    activeModuleId, 
    selectModule, 
    activeLesson, 
    selectLesson, 
    loadModules,
    isLoadingModules,
    isLoadingLessons,
    error 
  } = useStudyStore()

  useEffect(() => {
    loadModules()
  }, [loadModules])

  if (isLoadingModules && modules.length === 0) {
    return (
      <div className="flex h-full items-center justify-center glass-card p-6 border-r border-border-subtle w-72">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center glass-card p-6 border-r border-border-subtle w-72 text-center">
        <AlertCircle className="h-8 w-8 text-danger mb-2" />
        <p className="text-sm text-text-primary">Erro ao carregar aulas</p>
        <p className="text-xs text-text-muted mt-1">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full w-72 flex-col glass-card border-r border-border-subtle overflow-hidden">
      <div className="p-4 border-b border-border-subtle bg-surface-hover/50">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <Folder className="h-4 w-4 text-accent" /> Módulos
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        {modules.map(mod => {
          const isActiveMod = activeModuleId === mod.id
          
          return (
            <div key={mod.id} className="space-y-1">
              <button
                onClick={() => selectModule(mod.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-left text-sm rounded-[var(--radius-sm)] transition-colors",
                  isActiveMod ? "bg-accent/10 text-accent font-medium" : "text-text-secondary hover:bg-surface-hover"
                )}
              >
                <span className="truncate">{mod.name}</span>
              </button>
              
              {isActiveMod && (
                <div className="pl-4 pr-1 py-1 space-y-0.5 border-l-2 border-border-subtle ml-3">
                  {isLoadingLessons ? (
                    <div className="flex items-center gap-2 py-2 px-2 text-xs text-text-muted">
                      <Loader2 className="h-3 w-3 animate-spin" /> Carregando...
                    </div>
                  ) : mod.lessons.length > 0 ? (
                    mod.lessons.map(lesson => {
                      const isActiveLesson = activeLesson?.baseName === lesson.baseName
                      return (
                        <button
                          key={lesson.baseName}
                          onClick={() => selectLesson(lesson)}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 text-xs text-left rounded-md transition-colors",
                            isActiveLesson ? "bg-surface-active text-text-primary font-medium shadow-sm border border-border-subtle" : "text-text-muted hover:bg-surface-hover hover:text-text-secondary"
                          )}
                        >
                          <PlayCircle className={cn("h-3.5 w-3.5 shrink-0", isActiveLesson ? "text-accent" : "")} />
                          <span className="truncate leading-tight">{lesson.baseName}</span>
                        </button>
                      )
                    })
                  ) : (
                    <div className="py-2 px-2 text-xs text-text-muted italic">Nenhuma aula encontrada</div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
