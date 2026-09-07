// Opslag van content-bestanden (reels, carrousel-slides) in IndexedDB.
// localStorage kan geen video's aan; IndexedDB wel (honderden MB's).
// Bestanden staan per toestel opgeslagen: uploaden en downloaden op hetzelfde toestel.

const DB_NAME = 'content-files-v1'
const STORE = 'files'

export interface StoredFile {
  name: string
  type: string
  blob: Blob
  savedAt: string
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveContentFile(cardId: string, file: File): Promise<void> {
  const db = await openDB()
  const stored: StoredFile = { name: file.name, type: file.type, blob: file, savedAt: new Date().toISOString() }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(stored, cardId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getContentFile(cardId: string): Promise<StoredFile | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(cardId)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  })
}

export async function deleteContentFile(cardId: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(cardId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function downloadContentFile(cardId: string): Promise<boolean> {
  const stored = await getContentFile(cardId)
  if (!stored) return false
  const url = URL.createObjectURL(stored.blob)
  const a = document.createElement('a')
  a.href = url
  a.download = stored.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
  return true
}
