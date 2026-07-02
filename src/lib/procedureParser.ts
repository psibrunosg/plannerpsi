import type { ParsedProcedureDesc, ParsedStepDesc, FlowPosition, ProcedureColumn } from '@/types'

// Default fallback columns if a procedure has no columns defined
export const DEFAULT_COLUMNS: ProcedureColumn[] = [
  { id: 'col-todo', title: 'A Fazer', order: 0 },
  { id: 'col-doing', title: 'Em Andamento', order: 1 },
  { id: 'col-done', title: 'Concluído', order: 2 },
]

export function parseProcedureDesc(description: string | null): ParsedProcedureDesc {
  const defaultDesc: ParsedProcedureDesc = { text: '', columns: DEFAULT_COLUMNS, edges: [] }
  if (!description) return defaultDesc
  try {
    const parsed = JSON.parse(description)
    if (parsed && typeof parsed === 'object') {
      return {
        text: parsed.text || '',
        columns: Array.isArray(parsed.columns) && parsed.columns.length > 0 ? parsed.columns : DEFAULT_COLUMNS,
        edges: Array.isArray(parsed.edges) ? parsed.edges : [],
        viewport: parsed.viewport
      }
    }
  } catch (e) {
    // If it's not JSON, treat it as plain text
  }
  return { ...defaultDesc, text: description }
}

export function stringifyProcedureDesc(parsed: ParsedProcedureDesc): string {
  return JSON.stringify(parsed)
}

export function parseStepDesc(description: string | null, fallbackColumnId: string = 'col-todo', fallbackPosition: FlowPosition = { x: 0, y: 0 }): ParsedStepDesc {
  const defaultDesc: ParsedStepDesc = { text: '', column_id: fallbackColumnId, position: fallbackPosition }
  if (!description) return defaultDesc
  try {
    const parsed = JSON.parse(description)
    if (parsed && typeof parsed === 'object') {
      return {
        text: parsed.text || '',
        column_id: parsed.column_id || fallbackColumnId,
        position: parsed.position || fallbackPosition
      }
    }
  } catch (e) {
    // If it's not JSON, treat it as plain text
  }
  return { ...defaultDesc, text: description }
}

export function stringifyStepDesc(parsed: ParsedStepDesc): string {
  return JSON.stringify(parsed)
}
