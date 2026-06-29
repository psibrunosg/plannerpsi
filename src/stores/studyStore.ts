import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fetchModules, fetchModuleTopics, COURSES } from '@/lib/drive'
import type { DriveModule, LessonGroup } from '@/lib/drive'

interface StudyState {
  activeCourseId: string
  modules: DriveModule[]
  activeModuleId: string | null
  activeLesson: LessonGroup | null
  isLoadingModules: boolean
  isLoadingLessons: boolean
  error: string | null
  isAudioMode: boolean
  
  // Actions
  selectCourse: (courseId: string) => Promise<void>
  loadModules: () => Promise<void>
  selectModule: (moduleId: string) => Promise<void>
  selectLesson: (lesson: LessonGroup) => void
  setIsAudioMode: (isAudio: boolean) => void
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      activeCourseId: COURSES[0].id,
      modules: [],
      activeModuleId: null,
      activeLesson: null,
      isLoadingModules: false,
      isLoadingLessons: false,
      error: null,
      isAudioMode: false,

      selectCourse: async (courseId: string) => {
        if (get().activeCourseId === courseId) return
        set({ 
          activeCourseId: courseId, 
          modules: [], 
          activeModuleId: null, 
          activeLesson: null,
          error: null
        })
        await get().loadModules()
      },

      loadModules: async () => {
        if (get().modules.length > 0) return // Already loaded
        
        const courseId = get().activeCourseId
        const course = COURSES.find(c => c.id === courseId)
        if (!course) return
        
        set({ isLoadingModules: true, error: null })
        try {
          const mods = await fetchModules(course.folderId)
          set({ modules: mods, isLoadingModules: false })
          
          // Auto select first module if none selected
          if (mods.length > 0 && !get().activeModuleId) {
            get().selectModule(mods[0].id)
          }
        } catch (err: any) {
          set({ error: err.message, isLoadingModules: false })
        }
      },

      selectModule: async (moduleId: string) => {
        set({ activeModuleId: moduleId, isLoadingLessons: true, error: null })
        try {
          // Check if lessons are already loaded
          const mods = get().modules
          const modIndex = mods.findIndex(m => m.id === moduleId)
          
          if (modIndex >= 0 && mods[modIndex].topics.length === 0) {
            const moduleName = mods[modIndex].name
            const topics = await fetchModuleTopics(moduleId, moduleName)
            const updatedMods = [...mods]
            updatedMods[modIndex] = { ...updatedMods[modIndex], topics }
            set({ modules: updatedMods })
          }
          set({ isLoadingLessons: false })
        } catch (err: any) {
          set({ error: err.message, isLoadingLessons: false })
        }
      },

      selectLesson: (lesson: LessonGroup) => set({ activeLesson: lesson }),
      
      setIsAudioMode: (isAudio: boolean) => set({ isAudioMode: isAudio }),
    }),
    {
      name: 'plannerpsi-study-storage',
      partialize: (state) => ({ 
        activeCourseId: state.activeCourseId,
        activeModuleId: state.activeModuleId,
        isAudioMode: state.isAudioMode 
      }), // Persist user preferences but not the modules cache itself to keep it fresh
    }
  )
)
