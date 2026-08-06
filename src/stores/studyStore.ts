import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { fetchModules, fetchModuleTopics, COURSES } from '@/lib/drive'
import type { DriveModule, DriveTopic, LessonGroup } from '@/lib/drive'

function flattenModuleLessons(topics: DriveTopic[]): LessonGroup[] {
  let lessons: LessonGroup[] = []
  for (const topic of topics) {
    lessons = lessons.concat(topic.lessons, flattenModuleLessons(topic.subtopics || []))
  }
  return lessons
}

interface StudyState {
  activeCourseId: string
  modules: DriveModule[]
  activeModuleId: string | null
  activeLesson: LessonGroup | null
  isLoadingModules: boolean
  isLoadingLessons: boolean
  error: string | null
  isAudioMode: boolean
  completedLessons: string[]
  isPlaying: boolean
  playbackRate: number
  lessonPositions: Record<string, number>
  volume: number
  lessonNotes: Record<string, string>

  // Actions
  selectCourse: (courseId: string) => Promise<void>
  loadModules: () => Promise<void>
  selectModule: (moduleId: string) => Promise<void>
  selectLesson: (lesson: LessonGroup) => void
  setIsAudioMode: (isAudio: boolean) => void
  toggleLessonCompleted: (lessonId: string) => Promise<void>
  loadCompletedLessonsFromDB: () => Promise<void>
  setIsPlaying: (isPlaying: boolean) => void
  playNextLesson: () => Promise<void>
  playPreviousLesson: () => Promise<void>
  setPlaybackRate: (rate: number) => void
  saveLessonPosition: (baseName: string, time: number) => void
  getLessonPosition: (baseName: string) => number
  saveLessonNote: (baseName: string, note: string) => void
  getLessonNote: (baseName: string) => string
  setVolume: (volume: number) => void
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
      completedLessons: [],
      isPlaying: false,
      playbackRate: 1,
      lessonPositions: {},
      volume: 1,
      lessonNotes: {},

      setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),

      setPlaybackRate: (rate: number) => set({ playbackRate: rate }),

      setVolume: (volume: number) => set({ volume }),

      saveLessonPosition: (baseName: string, time: number) =>
        set((s) => ({ lessonPositions: { ...s.lessonPositions, [baseName]: time } })),

      getLessonPosition: (baseName: string) => get().lessonPositions[baseName] ?? 0,

      saveLessonNote: (baseName: string, note: string) =>
        set((s) => ({ lessonNotes: { ...s.lessonNotes, [baseName]: note } })),

      getLessonNote: (baseName: string) => get().lessonNotes[baseName] ?? '',

      playNextLesson: async () => {
        const { modules, activeModuleId, activeLesson, selectModule, selectLesson } = get()
        if (!activeModuleId || !activeLesson) return
        
        const modIndex = modules.findIndex(m => m.id === activeModuleId)
        if (modIndex === -1) return
        
        const mod = modules[modIndex]
        const lessons = flattenModuleLessons(mod.topics)
        const idx = lessons.findIndex(l => l.baseName === activeLesson.baseName)

        if (idx !== -1 && idx < lessons.length - 1) {
          selectLesson(lessons[idx + 1])
          return
        }
        
        // If last lesson in module, try next module
        if (modIndex < modules.length - 1) {
          const nextMod = modules[modIndex + 1]
          await selectModule(nextMod.id)
          const updatedMods = get().modules
          const updatedNextMod = updatedMods.find(m => m.id === nextMod.id)
          if (updatedNextMod) {
            const nextLessons = flattenModuleLessons(updatedNextMod.topics)
            if (nextLessons.length > 0) {
              selectLesson(nextLessons[0])
            }
          }
        }
      },

      playPreviousLesson: async () => {
        const { modules, activeModuleId, activeLesson, selectModule, selectLesson } = get()
        if (!activeModuleId || !activeLesson) return

        const modIndex = modules.findIndex(m => m.id === activeModuleId)
        if (modIndex === -1) return

        const mod = modules[modIndex]
        const lessons = flattenModuleLessons(mod.topics)
        const idx = lessons.findIndex(l => l.baseName === activeLesson.baseName)

        if (idx > 0) {
          selectLesson(lessons[idx - 1])
          return
        }

        // If first lesson in module, try previous module
        if (modIndex > 0) {
          const prevMod = modules[modIndex - 1]
          await selectModule(prevMod.id)
          const updatedMods = get().modules
          const updatedPrevMod = updatedMods.find(m => m.id === prevMod.id)
          if (updatedPrevMod) {
            const prevLessons = flattenModuleLessons(updatedPrevMod.topics)
            if (prevLessons.length > 0) {
              selectLesson(prevLessons[prevLessons.length - 1])
            }
          }
        }
      },

      loadCompletedLessonsFromDB: async () => {
        const user = useAuthStore.getState().user
        if (!user) return

        const { data, error } = await supabase
          .from('user_preferences')
          .select('completed_lessons')
          .eq('user_id', user.id)
          .single()

        if (!error && data?.completed_lessons) {
          set({ completedLessons: data.completed_lessons as string[] })
        }
      },

      toggleLessonCompleted: async (lessonId: string) => {
        const { completedLessons } = get()
        let newCompleted = []
        
        if (completedLessons.includes(lessonId)) {
          newCompleted = completedLessons.filter(id => id !== lessonId)
        } else {
          newCompleted = [...completedLessons, lessonId]
        }
        
        set({ completedLessons: newCompleted })

        const user = useAuthStore.getState().user
        if (user) {
          const { error } = await supabase
            .from('user_preferences')
            .upsert({ 
              user_id: user.id, 
              completed_lessons: newCompleted,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' })
          
          if (error) console.error('Error syncing completed lessons:', error)
        }
      },

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
        if (get().activeModuleId === moduleId) {
          set({ activeModuleId: null })
          return
        }

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
        isAudioMode: state.isAudioMode,
        completedLessons: state.completedLessons || [],
        playbackRate: state.playbackRate,
        lessonPositions: state.lessonPositions || {},
        volume: state.volume,
        lessonNotes: state.lessonNotes || {}
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        completedLessons: persistedState?.completedLessons || currentState.completedLessons || [],
        lessonPositions: persistedState?.lessonPositions || currentState.lessonPositions || {},
        lessonNotes: persistedState?.lessonNotes || currentState.lessonNotes || {},
        playbackRate: persistedState?.playbackRate || currentState.playbackRate || 1,
        volume: persistedState?.volume ?? currentState.volume ?? 1,
        activeCourseId: COURSES.find(c => c.id === persistedState?.activeCourseId) ? persistedState.activeCourseId : COURSES[0].id
      })
    }
  )
)
