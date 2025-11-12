export type ExtractedEntity = {
  name: string
  type: 'Person' | 'Organization' | 'Place' | 'Other'
}

const ORG_SUFFIXES = [
  'Group','Corp','Company','Council','Party','Bank','University','Committee',
  'Agency','Authority','Ministry','Parliament','Police','Court','Institute','Foundation'
]
const GEO_TERMS = [
  'Sweden','Stockholm','Gothenburg','Göteborg','Malmo','Malmö','Uppsala',
  'Europe','EU','Nordic','Scandinavia'
]

const CAPS_PHRASE = /\b([A-ZÅÄÖ][\p{L}’'-]+(?:\s+[A-ZÅÄÖ][\p{L}’'-]+){0,3})\b/gu

export const extractEntities = (text: string, limit = 25): ExtractedEntity[] => {
  if (!text?.trim()) return []
  const set = new Map<string, ExtractedEntity>()

  const phrases = Array.from(text.matchAll(CAPS_PHRASE))
    .map(m => m[1])
    .filter(s => s.length >= 3)

  for (const name of phrases) {
    const last = name.split(/\s+/).pop() || ''

    if (ORG_SUFFIXES.includes(last)) {
      set.set(name, { name, type: 'Organization' })
      continue
    }

    if (GEO_TERMS.includes(name)) {
      set.set(name, { name, type: 'Place' })
      continue
    }

    if (/\b[A-ZÅÄÖ][\p{L}’'-]+\s+[A-ZÅÄÖ][\p{L}’'-]+\b/u.test(name)) {
      set.set(name, { name, type: 'Person' })
      continue
    }

    if (!set.has(name)) set.set(name, { name, type: 'Other' })
  }

  return Array.from(set.values()).slice(0, limit)
}
