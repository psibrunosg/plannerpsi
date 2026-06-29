import { useEffect, useState } from 'react'
import { Folder, PlayCircle, Loader2, AlertCircle, ChevronDown, ChevronRight, FolderOpen } from 'lucide-react'
import { useStudyStore } from '@/stores/studyStore'
import { cn } from '@/lib/cn'
import type { DriveTopic, LessonGroup } from '@/lib/drive'

function TopicNode({ 
  topic, 
  depth = 0, 
  activeLesson, 
  onSelectLesson 
}: { 
  topic: DriveTopic, 
  depth?: number, 
  activeLesson: LessonGroup | null, 
  onSelectLesson: (l: LessonGroup) => void 
}) {
  const [isOpen, setIsOpen] = useState(depth === 0) // root level topics are open by default
  const hasChildren = topic.subtopics.length > 0 || topic.lessons.length > 0
  
  // If it's the pseudo root topic created for module direct files, just render lessons directly without folder UI
  if (topic.id.endsWith('-root')) {
    return (
      <div className="space-y-0.5 mt-1">
        {topic.lessons.map(lesson => {
          const isActiveLesson = activeLesson?.baseName === lesson.baseName
          return (
            <button
              key={lesson.baseName}
              onClick={() => onSelectLesson(lesson)}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 text-xs text-left rounded-md transition-colors",
                isActiveLesson ? "bg-surface-active text-text-primary font-medium shadow-sm border border-border-subtle" : "text-text-muted hover:bg-surface-hover hover:text-text-secondary"
              )}
            >
              <PlayCircle className={cn("h-3.5 w-3.5 shrink-0", isActiveLesson ? "text-accent" : "")} />
              <span className="truncate leading-tight">{lesson.baseName}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-0.5 mt-1">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn("w-full flex items-center justify-between py-1.5 px-2 text-left text-xs rounded-md transition-colors hover:bg-surface-hover",
        isOpen ? "text-text-primary font-medium" : "text-text-secondary")}
      >
        <div className="flex items-center gap-1.5 truncate">
          {isOpen ? <FolderOpen className="h-3.5 w-3.5 text-accent shrink-0" /> : <Folder className="h-3.5 w-3.5 text-accent opacity-70 shrink-0" />}
          <span className="truncate">{topic.name}</span>
        </div>
        {hasChildren && (
          isOpen ? <ChevronDown className="h-3 w-3 shrink-0 opacity-50" /> : <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
        )}
      </button>

      {isOpen && hasChildren && (
        <div className="pl-3 py-0.5 space-y-0.5 border-l border-border-subtle/50 ml-2">
          {topic.subtopics.map(sub => (
            <TopicNode key={sub.id} topic={sub} depth={depth + 1} activeLesson={activeLesson} onSelectLesson={onSelectLesson} />
          ))}
          {topic.lessons.map(lesson => {
            const isActiveLesson = activeLesson?.baseName === lesson.baseName
            return (
              <button
                key={lesson.baseName}
                onClick={() => onSelectLesson(lesson)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 text-xs text-left rounded-md transition-colors",
                  isActiveLesson ? "bg-surface-active text-text-primary font-medium shadow-sm border border-border-subtle" : "text-text-muted hover:bg-surface-hover hover:text-text-secondary"
                )}
              >
                <PlayCircle className={cn("h-3.5 w-3.5 shrink-0", isActiveLesson ? "text-accent" : "")} />
                <span className="truncate leading-tight">{lesson.baseName}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

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
    error,
    activeCourseId,
    selectCourse
  } = useStudyStore()

  useEffect(() => {
    loadModules()
  }, [loadModules])

  return (
    <div className="flex h-full w-72 flex-col glass-card border-r border-border-subtle overflow-hidden">
      <div className="p-4 border-b border-border-subtle bg-surface-hover/50 shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-text-primary flex items-center gap-2">
            <Folder className="h-4 w-4 text-accent" /> Cursos
          </h2>
        </div>
        
        {/* Course Selector */}
        <div className="flex bg-surface rounded-lg p-1 border border-border-subtle">
          <button
            onClick={() => selectCourse('inpbe')}
            className={cn(
              "flex-1 text-xs py-1.5 px-2 rounded-md font-medium transition-colors text-center",
              activeCourseId === 'inpbe' ? "bg-accent/10 text-accent shadow-sm" : "text-text-secondary hover:text-text-primary"
            )}
          >
            INPBE
          </button>
          <button
            onClick={() => selectCourse('cognitivo')}
            className={cn(
              "flex-1 text-xs py-1.5 px-2 rounded-md font-medium transition-colors text-center",
              activeCourseId === 'cognitivo' ? "bg-accent/10 text-accent shadow-sm" : "text-text-secondary hover:text-text-primary"
            )}
          >
            Cognitivo
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 relative">
        {isLoadingModules && modules.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="h-8 w-8 text-danger mb-2" />
            <p className="text-sm text-text-primary">Erro ao carregar</p>
            <p className="text-xs text-text-muted mt-1">{error}</p>
          </div>
        ) : modules.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-text-muted">
            <p className="text-sm">Nenhum módulo encontrado</p>
          </div>
        ) : (
          modules.map(mod => {
            const isActiveMod = activeModuleId === mod.id
            
            return (
              <div key={mod.id} className="space-y-1">
                <button
                  onClick={() => selectModule(mod.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-left text-sm rounded-[var(--radius-sm)] transition-colors",
                    isActiveMod ? "bg-accent/10 text-accent font-medium border border-accent/20 shadow-sm" : "text-text-secondary hover:bg-surface-hover border border-transparent"
                  )}
                >
                  <span className="truncate">{mod.name}</span>
                  {!isActiveMod && mod.topics?.length > 0 && <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />}
                  {isActiveMod && <ChevronDown className="h-4 w-4 shrink-0" />}
                </button>
                
                {isActiveMod && (
                  <div className="pl-3 pr-1 py-1">
                    {isLoadingLessons ? (
                      <div className="flex items-center gap-2 py-2 px-2 text-xs text-text-muted border-l-2 border-border-subtle ml-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Carregando Estrutura...
                      </div>
                    ) : mod.topics?.length > 0 ? (
                      <div className="space-y-0 border-l-2 border-border-subtle ml-1 pl-1">
                        {mod.topics.map(topic => (
                          <TopicNode 
                            key={topic.id} 
                            topic={topic} 
                            activeLesson={activeLesson} 
                            onSelectLesson={selectLesson} 
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="py-2 px-2 text-xs text-text-muted italic border-l-2 border-border-subtle ml-1 pl-3">
                        Nenhuma pasta ou aula encontrada
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
