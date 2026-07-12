import React, { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import type { TaskComment } from '@/types'
import { Send, User as UserIcon, MessageSquare } from 'lucide-react'

export function TaskComments({ taskId }: { taskId: string }) {
  const [comments, setComments] = useState<TaskComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const fetchRequestRef = useRef(0)
  const user = useAuthStore(s => s.user)
  const addToast = useToastStore(s => s.addToast)

  const fetchComments = useCallback(async () => {
    const requestId = ++fetchRequestRef.current
    const { data, error } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    if (error) {
      if (requestId !== fetchRequestRef.current) return
      addToast('Não foi possível carregar os comentários.', 'error')
      setLoading(false)
      return
    }

    const userIds = [...new Set((data ?? []).map(comment => comment.user_id))]
    const { data: profiles, error: profilesError } = userIds.length > 0
      ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
      : { data: [], error: null }

    if (requestId !== fetchRequestRef.current) return

    if (profilesError) {
      addToast('Os comentários foram carregados sem os dados dos autores.', 'error')
    }

    const profilesById = new Map((profiles ?? []).map(profile => [profile.id, profile]))
    setComments((data ?? []).map(comment => ({
      ...comment,
      user: profilesById.get(comment.user_id),
    })))
    setLoading(false)
  }, [addToast, taskId])

  useEffect(() => {
    setLoading(true)
    setComments([])
    fetchComments()
    
    // Subscribe to new comments
    const subscription = supabase
      .channel(`task_comments:${taskId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_comments', filter: `task_id=eq.${taskId}` }, () => {
        fetchComments()
      })
      .subscribe()

    return () => {
      fetchRequestRef.current += 1
      supabase.removeChannel(subscription)
    }
  }, [fetchComments, taskId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return

    const comment = newComment.trim()
    setSubmitting(true)

    const { error } = await supabase.from('task_comments').insert({
      task_id: taskId,
      user_id: user.id,
      content: comment
    })

    setSubmitting(false)
    if (error) {
      addToast('Não foi possível enviar o comentário. Tente novamente.', 'error')
      return
    }

    setNewComment('')
  }

  return (
    <div className="mt-8 border-t border-white/5 pt-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={16} className="text-text-secondary" />
        <h3 className="text-sm font-medium text-text-primary">Discussão da Tarefa</h3>
      </div>

      <div className="space-y-4 mb-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
        {loading ? (
          <div className="text-xs text-text-secondary text-center py-4">Carregando comentários...</div>
        ) : comments.length === 0 ? (
          <div className="text-xs text-text-secondary text-center py-4">Nenhum comentário ainda.</div>
        ) : (
          comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center shrink-0">
                {c.user?.full_name ? (
                  <span className="text-xs font-semibold text-text-secondary">{c.user.full_name.charAt(0).toUpperCase()}</span>
                ) : (
                  <UserIcon size={14} className="text-text-secondary" />
                )}
              </div>
              <div className="flex-1 bg-surface-hover/50 rounded-2xl rounded-tl-none px-4 py-3 border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-text-primary">{c.user?.full_name || 'Usuário'}</span>
                  <span className="text-[10px] text-text-secondary">
                    {new Date(c.created_at).toLocaleDateString('pt-BR')} {new Date(c.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-text-secondary whitespace-pre-wrap">{c.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 relative">
        <input
          type="text"
          aria-label="Novo comentário"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Escreva um comentário..."
          className="flex-1 bg-surface-hover border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary/50 transition-all pr-12"
        />
        <button
          type="submit"
          aria-label={submitting ? 'Enviando comentário' : 'Enviar comentário'}
          aria-busy={submitting}
          disabled={!newComment.trim() || submitting}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-accent-primary disabled:text-text-secondary/50 hover:bg-accent-primary/10 rounded-lg transition-colors"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
