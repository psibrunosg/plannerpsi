import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import { pageTransition } from '@/lib/motion'
import { StudySidebar } from '@/components/study/StudySidebar'
import { StudyPlayer } from '@/components/study/StudyPlayer'
import { StudyTranscript } from '@/components/study/StudyTranscript'
import { useStudyStore } from '@/stores/studyStore'
import { COURSES } from '@/lib/drive'

export default function Study() {
  const { activeCourseId } = useStudyStore()
  const activeCourse = COURSES.find(c => c.id === activeCourseId)
  
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
            <StudyTranscript />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
