import { useEffect, useState, useRef } from 'react'
import { Tv, PlayCircle, Loader2, AlertCircle, ChevronDown, ChevronRight, Upload } from 'lucide-react'
import { useIptvStore } from '@/stores/iptvStore'
import { cn } from '@/lib/cn'

export function IptvSidebar() {
  const { 
    channels,
    groups,
    visibleGroups,
    activeChannel,
    isLoading,
    error,
    fetchPlaylists,
    loadLocalPlaylists,
    setActiveChannel
  } = useIptvStore()

  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchPlaylists()
  }, [fetchPlaylists])

  const visibleGroupsList = groups.filter(g => visibleGroups.includes(g))

  // Set first visible group active when loaded
  useEffect(() => {
    if (visibleGroupsList.length > 0 && !searchQuery && (!activeGroup || !visibleGroupsList.includes(activeGroup))) {
      setActiveGroup(visibleGroupsList[0])
    }
  }, [visibleGroupsList, activeGroup, searchQuery])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await loadLocalPlaylists(e.target.files)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const query = searchQuery.toLowerCase()

  return (
    <div className="flex h-full w-72 flex-col glass-card border-r border-border-subtle overflow-hidden">
      <div className="p-4 border-b border-border-subtle bg-surface-hover/50 shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-text-primary flex items-center gap-2">
            <Tv className="h-4 w-4 text-accent" /> Canais IPTV
          </h2>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-text-muted hover:text-accent hover:bg-accent/10 rounded-md transition-colors"
            title="Carregar pasta/arquivos locais (.m3u, .m3u8)"
          >
            <Upload className="h-4 w-4" />
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple 
            accept=".m3u,.m3u8"
            {...{ webkitdirectory: "true", directory: "true" } as any}
            onChange={handleFileChange}
          />
        </div>

        <input
          type="text"
          placeholder="Buscar canal..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-[var(--radius-sm)] bg-surface px-3 py-1.5 text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent border border-border-subtle"
        />
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
              onClick={() => fetchPlaylists(true)}
              className="mt-4 px-3 py-1.5 bg-accent/10 text-accent rounded-md text-xs hover:bg-accent/20"
            >
              Tentar Novamente
            </button>
          </div>
        ) : channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-text-muted">
            <p className="text-sm">Nenhum canal encontrado</p>
          </div>
        ) : visibleGroupsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-text-muted">
            <p className="text-sm">Nenhuma categoria selecionada.</p>
            <p className="text-xs mt-2">Vá nas Configurações para selecionar as categorias que deseja exibir.</p>
          </div>
        ) : (
          visibleGroupsList.map(group => {
            let groupChannels = channels.filter(c => c.group === group)
            
            if (query) {
              groupChannels = groupChannels.filter(c => c.name.toLowerCase().includes(query))
            }

            if (groupChannels.length === 0) return null

            const isActiveGroup = query ? true : activeGroup === group

            return (
              <div key={group} className="space-y-1">
                <button
                  onClick={() => !query && setActiveGroup(isActiveGroup ? null : group)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-left text-sm rounded-[var(--radius-sm)] transition-colors",
                    isActiveGroup && !query ? "bg-accent/10 text-accent font-medium border border-accent/20 shadow-sm" : "text-text-secondary hover:bg-surface-hover border border-transparent"
                  )}
                  style={{ cursor: query ? 'default' : 'pointer' }}
                >
                  <span className="truncate flex-1 pr-2">{group || 'Sem Categoria'}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] tabular-nums text-text-muted">{groupChannels.length}</span>
                    {!query && (isActiveGroup ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />)}
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
