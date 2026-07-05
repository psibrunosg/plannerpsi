import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import { pageTransition } from '@/lib/motion'
import { StudySidebar } from '@/components/study/StudySidebar'
import { StudyPlayer } from '@/components/study/StudyPlayer'
import { StudyTranscript } from '@/components/study/StudyTranscript'
import { NotionEditor } from '@/components/study/NotionEditor'
import { useStudyStore } from '@/stores/studyStore'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/cn'
import { COURSES } from '@/lib/drive'

export default function Study() {
  const { activeCourseId, activeLesson, getLessonNote, saveLessonNote } = useStudyStore()
  const activeCourse = COURSES.find(c => c.id === activeCourseId)
  const [activeTab, setActiveTab] = useState<'transcript' | 'notes'>('transcript')
  const [noteContent, setNoteContent] = useState('')

  // Sync note content when lesson changes
  useEffect(() => {
    if (activeLesson) {
      setNoteContent(getLessonNote(activeLesson.baseName))
    } else {
      setNoteContent('')
    }
  }, [activeLesson?.baseName])

  // Auto save notes with debounce (or on change since it's local)
  const handleNoteChange = (content: string) => {
    setNoteContent(content)
    if (activeLesson) {
      saveLessonNote(activeLesson.baseName, content)
    }
  }
  
  return (
    <motion.div 
      className="flex h-[calc(100vh-6rem)] flex-col"
      variants={pageTransition} 
      initial="hidden" 
      animate="visible" 
      exit="exit"
    >
      <div className="mb-6 shrink-0">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-accent" />
          <span className="gradient-text">{activeCourse?.name || 'Cursos'}</span>
        </h1>
        <p className="mt-1 text-text-secondary">Assista às suas aulas, ouça os áudios e acompanhe a transcrição</p>
      </div>

      <div className="flex flex-1 gap-6 min-h-0 overflow-hidden flex-col xl:flex-row">
        {/* Sidebar for Modules & Lessons */}
        <div className="hidden md:flex h-full shrink-0">
          <StudySidebar />
        </div>

        {/* Main Content Area (Player + Transcript) */}
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 pb-4">
          <div className="md:hidden mb-4 h-64 shrink-0">
            <StudySidebar />
          </div>
          
          <div className="w-full xl:max-w-4xl mx-auto flex flex-col gap-6 flex-1">
            <StudyPlayer />
            
            {/* Tabs */}
            <div className="flex border-b border-border-subtle bg-surface-elevated/30">
              <button
                onClick={() => setActiveTab('transcript')}
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2",
                  activeTab === 'transcript' 
                    ? "border-accent text-accent" 
                    : "border-transparent text-text-muted hover:text-text-primary hover:bg-surface-hover/50"
                )}
              >
                Transcrição
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2",
                  activeTab === 'notes' 
                    ? "border-accent text-accent" 
                    : "border-transparent text-text-muted hover:text-text-primary hover:bg-surface-hover/50"
                )}
              >
                Minhas Anotações
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1">
              {activeTab === 'transcript' ? (
                <StudyTranscript />
              ) : (
                <NotionEditor 
                  content={noteContent}
                  onChange={handleNoteChange}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
