const API_KEY = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY
const ROOT_FOLDER_ID = '1OX59Ra9Eq958HIeYKKwVPp9e6FkDP3un'
const BASE_URL = 'https://www.googleapis.com/drive/v3/files'

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  hasThumbnail?: boolean
  thumbnailLink?: string
}

export interface DriveModule {
  id: string
  name: string
  lessons: LessonGroup[]
}

export interface LessonGroup {
  baseName: string
  videoFile?: DriveFile
  audioFile?: DriveFile
  transcriptFile?: DriveFile
}

// Fetch list of files in a folder
async function fetchFolderContents(folderId: string): Promise<DriveFile[]> {
  if (!API_KEY) throw new Error('API Key não configurada')
  
  const query = `'${folderId}' in parents and trashed = false`
  const fields = 'files(id, name, mimeType, hasThumbnail, thumbnailLink)'
  const url = `${BASE_URL}?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&key=${API_KEY}&orderBy=name`

  const res = await fetch(url)
  if (!res.ok) throw new Error('Falha ao buscar pasta do Drive')
  
  const data = await res.json()
  return data.files || []
}

// Get all modules (subfolders of root)
export async function fetchModules(): Promise<DriveModule[]> {
  const files = await fetchFolderContents(ROOT_FOLDER_ID)
  // filter only folders
  const folders = files.filter(f => f.mimeType === 'application/vnd.google-apps.folder')
  
  return folders.map(f => ({
    id: f.id,
    name: f.name,
    lessons: []
  }))
}

// Get lessons for a specific module
export async function fetchModuleLessons(moduleId: string): Promise<LessonGroup[]> {
  const files = await fetchFolderContents(moduleId)
  
  // Group files by base name (removing extensions .mp4, .mp3, .md)
  const groups = new Map<string, LessonGroup>()

  files.forEach(file => {
    // Only care about video, audio and markdown
    if (
      !file.name.toLowerCase().endsWith('.mp4') && 
      !file.name.toLowerCase().endsWith('.mp3') && 
      !file.name.toLowerCase().endsWith('.md')
    ) {
      return
    }

    const extMatch = file.name.match(/\.(mp4|mp3|md)$/i)
    if (!extMatch) return
    
    const ext = extMatch[1].toLowerCase()
    const baseName = file.name.substring(0, file.name.length - ext.length - 1).trim()

    if (!groups.has(baseName)) {
      groups.set(baseName, { baseName })
    }
    
    const group = groups.get(baseName)!
    if (ext === 'mp4') group.videoFile = file
    else if (ext === 'mp3') group.audioFile = file
    else if (ext === 'md') group.transcriptFile = file
  })

  // Convert map to array and sort by name
  return Array.from(groups.values()).sort((a, b) => a.baseName.localeCompare(b.baseName))
}

// Generate direct streaming URL
export function getDriveStreamUrl(fileId: string): string {
  // Using the API endpoint for media download (requires API key)
  return `${BASE_URL}/${fileId}?alt=media&key=${API_KEY}`
}

// Fetch markdown content
export async function fetchMarkdownContent(fileId: string): Promise<string> {
  const url = getDriveStreamUrl(fileId)
  const res = await fetch(url)
  if (!res.ok) return 'Erro ao carregar a transcrição.'
  return await res.text()
}
