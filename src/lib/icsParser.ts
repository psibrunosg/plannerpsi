export interface ICSEvent {
  uid: string
  summary: string
  description: string
  location: string
  dtstart: Date
  dtend: Date
}

export async function fetchICSEvents(url: string): Promise<ICSEvent[]> {
  try {
    // We use allorigins.win to bypass CORS restrictions
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    const response = await fetch(proxyUrl)
    if (!response.ok) {
      throw new Error('Falha ao buscar calendário')
    }
    const data = await response.text()
    return parseICS(data)
  } catch (error) {
    console.error('Erro ao buscar ICS:', error)
    return []
  }
}

function parseICS(icsData: string): ICSEvent[] {
  const events: ICSEvent[] = []
  let currentEvent: Partial<ICSEvent> | null = null
  
  // Unfold lines (ICS folds lines longer than 75 bytes)
  const lines = icsData.split(/\r?\n/)
  const unfoldedLines: string[] = []
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    while (i + 1 < lines.length && (lines[i+1].startsWith(' ') || lines[i+1].startsWith('\t'))) {
      line += lines[i+1].substring(1)
      i++
    }
    unfoldedLines.push(line)
  }

  for (const line of unfoldedLines) {
    if (line === 'BEGIN:VEVENT') {
      currentEvent = {}
    } else if (line === 'END:VEVENT') {
      if (currentEvent && currentEvent.dtstart && currentEvent.summary) {
        events.push(currentEvent as ICSEvent)
      }
      currentEvent = null
    } else if (currentEvent) {
      const colonIdx = line.indexOf(':')
      if (colonIdx > 0) {
        const keyRaw = line.substring(0, colonIdx)
        const value = line.substring(colonIdx + 1)
        const key = keyRaw.split(';')[0]
        
        switch (key) {
          case 'UID':
            currentEvent.uid = value
            break
          case 'SUMMARY':
            currentEvent.summary = value.replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\n/g, ' ')
            break
          case 'DESCRIPTION':
            currentEvent.description = value.replace(/\\n/g, '\n')
            break
          case 'LOCATION':
            currentEvent.location = value
            break
          case 'DTSTART':
            currentEvent.dtstart = parseICSDate(value)
            break
          case 'DTEND':
            currentEvent.dtend = parseICSDate(value)
            break
        }
      }
    }
  }

  // Sort by start date
  return events.sort((a, b) => a.dtstart.getTime() - b.dtstart.getTime())
}

function parseICSDate(dateStr: string): Date {
  // Format: YYYYMMDDTHHMMSSZ or YYYYMMDDTHHMMSS
  const year = parseInt(dateStr.substring(0, 4), 10)
  const month = parseInt(dateStr.substring(4, 6), 10) - 1
  const day = parseInt(dateStr.substring(6, 8), 10)
  
  if (dateStr.length > 8) {
    const hour = parseInt(dateStr.substring(9, 11), 10)
    const minute = parseInt(dateStr.substring(11, 13), 10)
    const second = parseInt(dateStr.substring(13, 15), 10)
    
    if (dateStr.endsWith('Z')) {
      return new Date(Date.UTC(year, month, day, hour, minute, second))
    } else {
      // Local time
      return new Date(year, month, day, hour, minute, second)
    }
  }
  
  // All day event
  return new Date(year, month, day)
}
