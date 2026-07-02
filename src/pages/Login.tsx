import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useToastStore } from '@/stores/toastStore'
import { Mail, Lock, Loader2, ArrowLeft } from 'lucide-react'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const addToast = useToastStore(s => s.addToast)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    setLoading(true)
    
    try {
      if (mode === 'login') {
        if (!password) return
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        addToast('Login realizado com sucesso!', 'success')
      } else if (mode === 'register') {
        if (!password) return
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        })
        if (error) throw error
        addToast('Conta criada! Verifique seu email se necessário, ou faça login.', 'success')
        setMode('login')
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/?type=recovery',
        })
        if (error) throw error
        addToast('Email de recuperação enviado! Verifique sua caixa de entrada.', 'success')
        setMode('login')
      }
    } catch (err: any) {
      addToast(err.message || 'Erro de autenticação', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4 text-text-primary">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8 relative overflow-hidden"
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">
            <span className="gradient-text">Planner PSI</span>
          </h1>
          <p className="mt-2 text-text-secondary">
            {mode === 'login' && 'Faça login na sua conta'}
            {mode === 'register' && 'Crie sua conta gratuitamente'}
            {mode === 'forgot' && 'Recuperar senha'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-[var(--radius-sm)] border border-border-subtle bg-surface-elevated py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-sm font-medium text-text-secondary">Senha</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-xs text-accent hover:text-accent-hover"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-[var(--radius-sm)] border border-border-subtle bg-surface-elevated py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || (mode !== 'forgot' && !password)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-accent py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            {mode === 'login' && 'Entrar'}
            {mode === 'register' && 'Criar Conta'}
            {mode === 'forgot' && 'Enviar Email'}
          </button>
        </form>

        <div className="mt-6 text-center">
          {mode === 'forgot' ? (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="flex w-full items-center justify-center gap-2 text-sm text-text-muted hover:text-accent"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para o Login
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-sm text-text-muted hover:text-accent"
            >
              {mode === 'login' ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
