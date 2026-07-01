// Chave pública para acesso de leitura aos arquivos. Em produção, restrinja no Google Cloud Console.
const API_KEY = 'AIzaSyBuTRCQfdRMJ1WH80-14yKKbuCsPN7oD1Y'
const BASE_URL = 'https://www.googleapis.com/drive/v3/files'

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  hasThumbnail?: boolean
  thumbnailLink?: string
}

export interface LessonGroup {
  baseName: string
  videoFile?: DriveFile
  audioFile?: DriveFile
  transcriptFile?: DriveFile
}

export interface DriveTopic {
  id: string
  name: string
  subtopics: DriveTopic[]
  lessons: LessonGroup[]
}

export interface DriveModule {
  id: string
  name: string
  topics: DriveTopic[]
}

export interface Course {
  id: string
  name: string
  folderId: string
}

export const COURSES: Course[] = [
  { id: 'inpbe', name: 'INPBE', folderId: '1OX59Ra9Eq958HIeYKKwVPp9e6FkDP3un' },
  { id: 'cognitivo', name: 'Cognitivo', folderId: '1H-0QxJrGoDpqOUf2nSlrmLZiCp7Jgg1O' }
]

// Fetch list of files in a folder
async function fetchFolderContents(folderId: string): Promise<DriveFile[]> {
  const query = `'${folderId}' in parents and trashed = false`
  const fields = 'files(id, name, mimeType, hasThumbnail, thumbnailLink)'
  const url = `${BASE_URL}?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&key=${API_KEY}&orderBy=name`

  const res = await fetch(url)
  if (!res.ok) throw new Error('Falha ao buscar pasta do Drive')
  
  const data = await res.json()
  return data.files || []
}

export async function fetchModules(courseFolderId: string): Promise<DriveModule[]> {
  const files = await fetchFolderContents(courseFolderId)
  const folders = files.filter(f => f.mimeType === 'application/vnd.google-apps.folder')
  
  return folders.map(f => ({
    id: f.id,
    name: f.name,
    topics: []
  }))
}

// Fetch files and structure them recursively into DriveTopic
async function fetchFolderTree(folderId: string, folderName: string): Promise<DriveTopic> {
  const files = await fetchFolderContents(folderId)
  
  const topic: DriveTopic = {
    id: folderId,
    name: folderName,
    subtopics: [],
    lessons: []
  }

  const rawFiles: DriveFile[] = []
  const subFolderPromises: Promise<DriveTopic>[] = []
  const mediaFolderPromises: Promise<DriveFile[]>[] = []

  for (const file of files) {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      const lowerName = file.name.toLowerCase()
      // If the folder is a media container, fetch its contents to merge them here
      if (['mp3', 'mp4', 'videos', 'vídeos', 'transcrição', 'transcrições', 'transcricao', 'transcricoes', 'áudios', 'audios'].includes(lowerName)) {
        mediaFolderPromises.push(fetchFolderContents(file.id))
      } else {
        // Otherwise, it's a real subtopic
        subFolderPromises.push(fetchFolderTree(file.id, file.name))
      }
    } else {
      rawFiles.push(file)
    }
  }

  // Merge media folders into rawFiles
  if (mediaFolderPromises.length > 0) {
    const mediaFoldersContents = await Promise.all(mediaFolderPromises)
    mediaFoldersContents.forEach(contents => rawFiles.push(...contents))
  }

  topic.subtopics = await Promise.all(subFolderPromises)
  // Sort subtopics by name
  topic.subtopics.sort((a, b) => a.name.localeCompare(b.name))

  // Group raw files into lessons
  const groups = new Map<string, LessonGroup>()

  rawFiles.forEach(file => {
    if (!file.name.toLowerCase().endsWith('.mp4') && 
        !file.name.toLowerCase().endsWith('.mp3') && 
        !file.name.toLowerCase().endsWith('.md')) {
      return
    }

    const extMatch = file.name.match(/\.(mp4|mp3|md)$/i)
    if (!extMatch) return
    
    const ext = extMatch[1].toLowerCase()
    const baseNameRaw = file.name.substring(0, file.name.length - ext.length - 1).trim()
    
    // Normalize baseName to prevent duplicates (e.g. "01-Name" vs "01 - Name")
    const baseNameKey = baseNameRaw.toLowerCase().replace(/\s*-\s*/g, '-').replace(/\s+/g, ' ')

    if (!groups.has(baseNameKey)) {
      groups.set(baseNameKey, { baseName: baseNameRaw })
    }
    
    const group = groups.get(baseNameKey)!
    // Prefer the first found if multiple exist, but usually they are 1 to 1
    if (ext === 'mp4' && !group.videoFile) group.videoFile = file
    else if (ext === 'mp3' && !group.audioFile) group.audioFile = file
    else if (ext === 'md' && !group.transcriptFile) group.transcriptFile = file
  })

  topic.lessons = Array.from(groups.values()).sort((a, b) => a.baseName.localeCompare(b.baseName))

  return topic
}

// Get topics for a specific module
export async function fetchModuleTopics(moduleId: string, moduleName: string): Promise<DriveTopic[]> {
  // A Module behaves like the root topic for this subtree.
  // We want to return its children (topics) and its own lessons (if any, packaged as a default topic).
  const moduleRoot = await fetchFolderTree(moduleId, moduleName)
  
  const topics = [...moduleRoot.subtopics]
  
  // If the module folder itself contains direct lessons, put them in a pseudo-topic
  if (moduleRoot.lessons.length > 0) {
    topics.unshift({
      id: `${moduleId}-root`,
      name: 'Aulas do Módulo',
      subtopics: [],
      lessons: moduleRoot.lessons
    })
  }
  
  return topics
}

// Generate direct streaming URL
export function getDriveStreamUrl(fileId: string): string {
  // Using the API endpoint for media download with acknowledgeAbuse to bypass large file virus scan warnings
  return `${BASE_URL}/${fileId}?alt=media&key=${API_KEY}&acknowledgeAbuse=true`
}

// Fetch markdown content
export async function fetchMarkdownContent(fileId: string): Promise<string> {
  const url = getDriveStreamUrl(fileId)
  const res = await fetch(url)
  if (!res.ok) return 'Erro ao carregar a transcrição.'
  return await res.text()
}
