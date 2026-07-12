import { ArrowRight, CircleAlert, Inbox, Send } from 'lucide-react'
import type { DelegationPulse } from '@/lib/delegationPulse'

interface DelegationPulseWidgetProps extends DelegationPulse {
  loading?: boolean
  onOpen: () => void
}

const pulseItems = [
  {
    key: 'awaitingYou',
    label: 'Aguardando você',
    hint: 'propostas para decidir',
    icon: Inbox,
    color: 'text-accent',
    background: 'bg-accent/10',
  },
  {
    key: 'awaitingOthers',
    label: 'Aguardando outra pessoa',
    hint: 'propostas enviadas',
    icon: Send,
    color: 'text-info',
    background: 'bg-info/10',
  },
  {
    key: 'overdueResponses',
    label: 'Sem resposta há mais de 48h',
    hint: 'pedem acompanhamento',
    icon: CircleAlert,
    color: 'text-warning',
    background: 'bg-warning/10',
  },
] as const

export function DelegationPulseWidget({
  awaitingYou,
  awaitingOthers,
  overdueResponses,
  loading = false,
  onOpen,
}: DelegationPulseWidgetProps) {
  const counts: DelegationPulse = { awaitingYou, awaitingOthers, overdueResponses }
  const hasActivity = awaitingYou + awaitingOthers > 0

  return (
    <section className="glass-card mt-6 p-5" aria-labelledby="delegation-pulse-title" aria-busy={loading}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="delegation-pulse-title" className="text-lg font-semibold text-text-primary">
            Pulso da delegação
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {loading
              ? 'Atualizando propostas...'
              : hasActivity
                ? 'Veja rapidamente onde cada colaboração está parada.'
                : 'Nenhuma proposta pendente no momento.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-[var(--radius-sm)] border border-border-subtle bg-surface-elevated px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Abrir propostas de delegação em Tarefas"
        >
          Abrir delegações
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {pulseItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.key}
              type="button"
              onClick={onOpen}
              className="flex min-h-20 items-center gap-3 rounded-[var(--radius-md)] border border-border-subtle bg-surface-elevated/60 p-3 text-left transition-colors hover:border-accent/40 hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={`${item.label}: ${counts[item.key]}. Abrir detalhes`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.background}`}>
                <Icon className={`h-5 w-5 ${item.color}`} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-2xl font-bold text-text-primary">{loading ? '…' : counts[item.key]}</span>
                <span className="block text-sm font-medium text-text-secondary">{item.label}</span>
                <span className="block text-xs text-text-muted">{item.hint}</span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
