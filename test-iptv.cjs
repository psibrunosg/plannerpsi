const fs = require('fs')
const http = require('http')
const https = require('https')

const LISTS = [
  'https://raw.githubusercontent.com/Ramys/Iptv-Brasil-2026/master/CanaisBR03.m3u8',
  'https://raw.githubusercontent.com/Ramys/Iptv-Brasil-2026/master/CanaisBR04.m3u8',
  'https://raw.githubusercontent.com/Ramys/Iptv-Brasil-2026/master/CanaisBR05.m3u8',
  'https://raw.githubusercontent.com/Ramys/Iptv-Brasil-2026/master/CanaisBR06.m3u8',
]

const CONCURRENCY_LIMIT = 20
const TIMEOUT_MS = 5000

// Helper to fetch text from a URL
async function fetchText(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchText(res.headers.location).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode}`))
      }
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve(data))
    }).on('error', reject)
  })
}

// Helper to test if a stream URL is working
async function testStream(url) {
  return new Promise((resolve) => {
    try {
      const client = url.startsWith('https') ? https : http
      
      const req = client.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': '*/*'
        }
      }, (res) => {
        // If it returns a 200, 301, 302, etc. we assume it works for now.
        if (res.statusCode >= 200 && res.statusCode < 400) {
          req.destroy()
          resolve(true)
        } else {
          req.destroy()
          resolve(false)
        }
      })
      
      req.on('error', () => resolve(false))
      req.setTimeout(TIMEOUT_MS, () => {
        req.destroy()
        resolve(false) // Timed out
      })
    } catch (e) {
      resolve(false)
    }
  })
}

async function run() {
  console.log('Baixando listas do Ramys...')
  let allLines = []
  
  for (const listUrl of LISTS) {
    try {
      console.log(`Baixando: ${listUrl}`)
      const text = await fetchText(listUrl)
      allLines = allLines.concat(text.split('\n').map(l => l.trim()))
    } catch (e) {
      console.error(`Erro ao baixar ${listUrl}:`, e.message)
    }
  }

  // Parse lines into channels
  const channels = []
  let currentExtinf = null
  const keywords = ['+18', 'adult', 'xxx', 'porn']
  
  for (const line of allLines) {
    if (!line) continue
    if (line.startsWith('#EXTM3U')) continue
    if (line.startsWith('#EXTINF:')) {
      currentExtinf = line
    } else if (!line.startsWith('#')) {
      if (currentExtinf) {
        const lower = currentExtinf.toLowerCase()
        if (keywords.some(k => lower.includes(k))) {
          channels.push({
            extinf: currentExtinf,
            url: line
          })
        }
        currentExtinf = null
      }
    }
  }

  console.log(`Total de canais encontrados: ${channels.length}`)
  console.log('Iniciando teste de canais (isso pode demorar)...\n')

  const workingChannels = []
  
  // Test concurrently
  for (let i = 0; i < channels.length; i += CONCURRENCY_LIMIT) {
    const chunk = channels.slice(i, i + CONCURRENCY_LIMIT)
    const promises = chunk.map(async (c) => {
      const isWorking = await testStream(c.url)
      if (isWorking) {
        workingChannels.push(c)
        // Extract name for logging
        let name = 'Desconhecido'
        const commaIndex = c.extinf.lastIndexOf(',')
        if (commaIndex !== -1) name = c.extinf.substring(commaIndex + 1).trim()
        console.log(`✅ [OK] ${name}`)
      }
    })
    
    await Promise.all(promises)
    process.stdout.write(`\rProgresso: ${Math.min(i + CONCURRENCY_LIMIT, channels.length)}/${channels.length} ...`)
  }

  console.log(`\n\nTeste concluído! ${workingChannels.length} canais funcionando de ${channels.length} totais.`)
  
  // Write to output file
  const outPath = 'adultos_funcionando.m3u'
  const outLines = ['#EXTM3U']
  for (const c of workingChannels) {
    outLines.push(c.extinf)
    outLines.push(c.url)
  }
  
  fs.writeFileSync(outPath, outLines.join('\n'))
  console.log(`Lista salva em: ${outPath}`)
}

run().catch(console.error)
