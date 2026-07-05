import { useEffect, useState } from 'react'
import { Tv, PlayCircle, Loader2, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { useIptvStore } from '@/stores/iptvStore'
import { cn } from '@/lib/cn'

export function IptvSidebar() {
  const { 
    channels,
    groups,
    activeChannel,
    isLoading,
    error,
    fetchPlaylists,
    setActiveChannel
  } = useIptvStore()

  const [activeGroup, setActiveGroup] = useState<string | null>(null)

  useEffect(() => {
    fetchPlaylists()
  }, [fetchPlaylists])

  // Set first group active when loaded
  useEffect(() => {
    if (groups.length > 0 && !activeGroup) {
      setActiveGroup(groups[0])
    }
  }, [groups, activeGroup])

  return (
    <div className="flex h-full w-72 flex-col glass-card border-r border-border-subtle overflow-hidden">
      <div className="p-4 border-b border-border-subtle bg-surface-hover/50 shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-text-primary flex items-center gap-2">
            <Tv className="h-4 w-4 text-accent" /> Canais IPTV
          </h2>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 relative">
        {isLoading && channels.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="h-8 w-8 text-danger mb-2" />
            <p className="text-sm text-text-primary">Erro ao carregar listas</p>
            <p className="text-xs text-text-muted mt-1">{error}</p>
            <button 
              onClick={fetchPlaylists}
              className="mt-4 px-3 py-1.5 bg-accent/10 text-accent rounded-md text-xs hover:bg-accent/20"
            >
              Tentar Novamente
            </button>
          </div>
        ) : channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-text-muted">
            <p className="text-sm">Nenhum canal encontrado</p>
          </div>
        ) : (
          groups.map(group => {
            const isActiveGroup = activeGroup === group
            const groupChannels = channels.filter(c => c.group === group)

            return (
              <div key={group} className="space-y-1">
                <button
                  onClick={() => setActiveGroup(isActiveGroup ? null : group)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-left text-sm rounded-[var(--radius-sm)] transition-colors",
                    isActiveGroup ? "bg-accent/10 text-accent font-medium border border-accent/20 shadow-sm" : "text-text-secondary hover:bg-surface-hover border border-transparent"
                  )}
                >
                  <span className="truncate flex-1 pr-2">{group || 'Sem Categoria'}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] tabular-nums text-text-muted">{groupChannels.length}</span>
                    {isActiveGroup ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />}
                  </div>
                </button>
                
                {isActiveGroup && (
                  <div className="pl-3 pr-1 py-1">
                    <div className="space-y-0.5 border-l-2 border-border-subtle ml-1 pl-1">
                      {groupChannels.map(channel => {
                        const isActiveChannel = activeChannel?.id === channel.id
                        return (
                          <button
                            key={channel.id}
                            onClick={() => setActiveChannel(channel)}
                            className={cn(
                              "w-full flex items-center gap-2 px-2 py-1.5 text-xs text-left rounded-md transition-colors",
                              isActiveChannel ? "bg-surface-active text-text-primary font-medium shadow-sm border border-border-subtle" : "text-text-muted hover:bg-surface-hover hover:text-text-secondary"
                            )}
                          >
                            <PlayCircle className={cn("h-3.5 w-3.5 shrink-0", isActiveChannel ? "text-accent" : "")} />
                            <span className="truncate leading-tight flex-1">{channel.name}</span>
                          </button>
                        )
                      })}
                    </div>
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
