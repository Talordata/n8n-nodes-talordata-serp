import * as cheerio from 'cheerio'
import MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'

export interface CanonicalSerpResult {
  position: number
  title: string
  link: string
  snippet: string
  source: string
}

export interface ParsedSerpContent {
  results: CanonicalSerpResult[]
  parseFormat: 'structured' | 'json' | 'html' | 'markdown' | 'markdown+html' | 'unknown'
  parseStatus: 'parsed' | 'empty' | 'failed'
  parseError: string
}

const RESULT_KEYS = ['organic_results', 'organic', 'results'] as const
const CONTAINER_KEYS = ['data', 'result'] as const
const SNIPPET_SELECTORS = ['.VwiC3b', '.aCOpRe', '.IsZvec', '[data-sncf]'] as const
const markdownParser = new MarkdownIt('commonmark')

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function cleanText(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function firstText(item: Record<string, unknown>, keys: readonly string[]): string {
  for (const key of keys) {
    const value = item[key]
    if (value !== null && typeof value !== 'undefined' && value !== '') {
      return cleanText(value)
    }
  }
  return ''
}

function positiveInteger(value: unknown): number | undefined {
  if (typeof value === 'boolean') return undefined
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function isGoogleHost(hostname: string): boolean {
  return hostname === 'google.com'
    || hostname.endsWith('.google.com')
    || hostname === 'googleusercontent.com'
    || hostname.endsWith('.googleusercontent.com')
    || hostname === 'gstatic.com'
    || hostname.endsWith('.gstatic.com')
}

function normalizeExternalUrl(value: unknown): string {
  let raw = cleanText(value)
  if (!raw) return ''

  const visibleOrigin = raw.match(
    /^(https?:\/\/(?:[a-z0-9-]+\.)+[a-z0-9-]+(?::\d+)?)(?:[›\s]|$)/i
  )
  if (visibleOrigin && raw.includes('›')) {
    raw = visibleOrigin[1]
  }

  if (raw.startsWith('/url?')) {
    const redirect = new URL(raw, 'https://www.google.com')
    raw = redirect.searchParams.get('q') || redirect.searchParams.get('url') || ''
  }

  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return ''
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '')
  if (!['http:', 'https:'].includes(parsed.protocol) || !hostname || isGoogleHost(hostname)) {
    return ''
  }

  parsed.protocol = parsed.protocol.toLowerCase()
  parsed.hostname = hostname
  parsed.hash = ''
  return parsed.toString().replace(/\/$/, parsed.pathname === '/' && !parsed.search ? '' : '/')
}

function normalizeRecords(items: unknown[]): CanonicalSerpResult[] {
  const results: CanonicalSerpResult[] = []
  const indexes = new Map<string, number>()

  for (const item of items) {
    if (!isRecord(item)) continue
    const title = firstText(item, ['title', 'name'])
    const link = normalizeExternalUrl(firstText(item, ['link', 'url']))
    if (!title || !link) continue

    const source = firstText(item, ['source', 'domain']) || new URL(link).hostname
    const record: CanonicalSerpResult = {
      position: positiveInteger(item.position) ?? positiveInteger(item.rank) ?? results.length + 1,
      title,
      link,
      snippet: firstText(item, ['snippet', 'description', 'summary']),
      source
    }
    const key = link.replace(/\/$/, '')
    const existingIndex = indexes.get(key)
    if (typeof existingIndex === 'undefined') {
      indexes.set(key, results.length)
      results.push(record)
      continue
    }

    const existing = results[existingIndex]
    results[existingIndex] = {
      ...existing,
      title: existing.title || record.title,
      snippet: existing.snippet || record.snippet,
      source: existing.source || record.source
    }
  }

  return results
}

function extractStructuredResults(payload: unknown): { results: CanonicalSerpResult[]; recognized: boolean } {
  const queue: unknown[] = [payload]
  const seen = new Set<object>()
  let recognized = false

  while (queue.length > 0) {
    const current = queue.shift()
    if (!isRecord(current) || seen.has(current)) continue
    seen.add(current)

    for (const key of RESULT_KEYS) {
      const value = current[key]
      if (!Array.isArray(value)) continue
      recognized = true
      const results = normalizeRecords(value)
      if (results.length > 0 || value.length === 0) return { results, recognized: true }
    }
    for (const key of CONTAINER_KEYS) {
      if (isRecord(current[key])) queue.push(current[key])
    }
  }

  return { results: [], recognized }
}

function extractEmbeddedJson(payload: unknown): unknown {
  const queue: unknown[] = [payload]
  const seen = new Set<object>()
  while (queue.length > 0) {
    const current = queue.shift()
    if (!isRecord(current) || seen.has(current)) continue
    seen.add(current)
    if (Object.prototype.hasOwnProperty.call(current, 'json')) {
      const embedded = current.json
      if (isRecord(embedded) || Array.isArray(embedded)) return embedded
      if (typeof embedded === 'string' && embedded.trim()) {
        try {
          return JSON.parse(embedded) as unknown
        } catch {}
      }
    }
    for (const key of CONTAINER_KEYS) {
      if (isRecord(current[key])) queue.push(current[key])
    }
  }
  return undefined
}

function looksLikeHtml(value: string): boolean {
  const text = value.trimStart().toLowerCase()
  return text.startsWith('<!doctype html') || text.startsWith('<html') || text.includes('<h3')
}

function looksLikeMarkdown(value: string): boolean {
  return /^(?:#{1,6}\s|[-*+]\s|\d+\.\s|\|.+\|)/m.test(value.trim())
}

function collectContent(payload: unknown): { html: string; markdown: string; text: string } {
  const queue: unknown[] = [payload]
  const seen = new Set<object>()
  let html = ''
  let markdown = ''
  let text = ''

  while (queue.length > 0) {
    const current = queue.shift()
    if (typeof current === 'string') {
      text ||= current
      if (looksLikeHtml(current)) html ||= current
      else if (looksLikeMarkdown(current)) markdown ||= current
      continue
    }
    if (!isRecord(current) || seen.has(current)) continue
    seen.add(current)

    if (typeof current.html === 'string') html ||= current.html
    if (typeof current.markdown === 'string') markdown ||= current.markdown
    for (const key of CONTAINER_KEYS) {
      const value = current[key]
      if (typeof value === 'string' || isRecord(value)) queue.push(value)
    }
  }

  return { html, markdown, text }
}

function explicitFailure(value: string): string {
  const message = cleanText(value)
  if (!message || message.length > 500) return ''
  const lowered = message.toLowerCase()
  return lowered.startsWith('error')
    || lowered.startsWith('md data retrieval failed')
    || lowered.startsWith('json fetch failed')
    || lowered.endsWith('collection failed')
    ? message
    : ''
}

export function parseHtmlResults(html: string): CanonicalSerpResult[] {
  if (!looksLikeHtml(html)) return []
  const $ = cheerio.load(html)
  const candidates: Record<string, unknown>[] = []

  $('a:has(h3)').each((_index, anchor) => {
    const title = cleanText($(anchor).find('h3').first().text())
    const link = normalizeExternalUrl($(anchor).attr('href'))
    if (!title || !link) return

    let container = $(anchor)
    for (let depth = 0; depth < 6; depth += 1) {
      const parent = container.parent()
      if (parent.length === 0) break
      container = parent
      if (container.hasClass('g') || typeof container.attr('data-snhf') !== 'undefined') break
    }
    let snippet = ''
    for (const selector of SNIPPET_SELECTORS) {
      snippet = cleanText(container.find(selector).first().text())
      if (snippet) break
    }
    candidates.push({ title, link, snippet })
  })

  return normalizeRecords(candidates)
}

function inlineLink(token: Token): { title: string; link: string } | undefined {
  const children = token.children || []
  const linkStart = children.findIndex((child) => child.type === 'link_open')
  if (linkStart < 0) return undefined
  const link = normalizeExternalUrl(children[linkStart].attrGet('href'))
  if (!link) return undefined
  const titleParts: string[] = []
  for (let index = linkStart + 1; index < children.length; index += 1) {
    if (children[index].type === 'link_close') break
    if (['text', 'code_inline'].includes(children[index].type)) titleParts.push(children[index].content)
  }
  return { title: cleanText(titleParts.join(' ')), link }
}

function headingResult(value: string): Record<string, unknown> | undefined {
  const match = cleanText(value).match(/^(?:(\d+)\.)?\s*(.+?)\(([^\s)]+)\)$/)
  if (!match) return undefined
  const link = normalizeExternalUrl(match[3])
  const position = positiveInteger(match[1])
  if (!link && (!position || !match[3].startsWith('/goto?url='))) return undefined
  return {
    position,
    title: cleanText(match[2]),
    ...(link ? { link } : {})
  }
}

function fieldValue(value: string): { key: string; value: string } {
  const text = cleanText(value)
  const separator = text.indexOf(':')
  if (separator < 0) return { key: '', value: text }
  let key = text.slice(0, separator).trim().toLowerCase().replace(/\s+/g, '_')
  const supported = new Set([
    'position', 'rank', 'title', 'name', 'link', 'url',
    'snippet', 'description', 'summary', 'source', 'domain'
  ])
  if (!supported.has(key)) return { key: '', value: text }
  if (key === 'rank') key = 'position'
  return { key, value: text.slice(separator + 1).trim() }
}

export function parseMarkdownResults(markdown: string): CanonicalSerpResult[] {
  if (!markdown.trim() || looksLikeHtml(markdown)) return []
  const tokens = markdownParser.parse(markdown, {})
  const candidates: Record<string, unknown>[] = []
  let organicLevel: number | undefined
  let inOrganic = false
  let current: Record<string, unknown> = {}

  const flush = () => {
    if (current.title && current.link) candidates.push(current)
    current = {}
  }

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (token.type === 'heading_open' && tokens[index + 1]?.type === 'inline') {
      const level = positiveInteger(token.tag.slice(1)) ?? 6
      const inline = tokens[index + 1]
      const heading = cleanText(inline.content)
      const lowered = heading.toLowerCase()
      const isOrganicHeading = lowered === 'organic'
        || (lowered.includes('organic') && lowered.includes('result'))
      const linkHeading = inlineLink(inline)
      const numberedHeading = headingResult(heading)
      if (isOrganicHeading) {
        flush()
        inOrganic = true
        organicLevel = level
      } else if (inOrganic && (linkHeading || numberedHeading)) {
        flush()
        current = linkHeading || numberedHeading || {}
      } else if (inOrganic && typeof organicLevel !== 'undefined' && level <= organicLevel) {
        flush()
        inOrganic = false
      }
      index += 1
      continue
    }

    if (!inOrganic || token.type !== 'list_item_open') continue
    const inlineTokens: Token[] = []
    let cursor = index + 1
    while (cursor < tokens.length && tokens[cursor].type !== 'list_item_close') {
      if (tokens[cursor].type === 'inline') inlineTokens.push(tokens[cursor])
      cursor += 1
    }
    for (const inline of inlineTokens) {
      const field = fieldValue(inline.content)
      const parsedLink = inlineLink(inline)
      if (field.key === 'position') {
        if (current.link) flush()
        current.position = positiveInteger(field.value)
      } else if (['title', 'name'].includes(field.key)) {
        current.title = field.value
      } else if (['link', 'url'].includes(field.key)) {
        current.link = parsedLink?.link || field.value
      } else if (['snippet', 'description', 'summary'].includes(field.key)) {
        current.snippet = field.value
      } else if (['source', 'domain'].includes(field.key)) {
        current.source = field.value
      } else if (!field.key) {
        const link = parsedLink?.link || normalizeExternalUrl(field.value)
        if (link && !current.link) {
          current.link = link
          if (parsedLink?.title) current.title ||= parsedLink.title
        } else if (current.title && !current.snippet && !link
          && !/^(?:\/goto\?url=|redirect_link:|favicon:|date:)/i.test(field.value)) {
          current.snippet = field.value
        }
      }
    }
    index = cursor
  }
  flush()
  return normalizeRecords(candidates)
}

function mergeResults(primary: CanonicalSerpResult[], fallback: CanonicalSerpResult[]): CanonicalSerpResult[] {
  const merged = normalizeRecords(primary)
  const indexes = new Map(merged.map((item, index) => [item.link.replace(/\/$/, ''), index]))
  for (const item of normalizeRecords(fallback)) {
    const key = item.link.replace(/\/$/, '')
    const existingIndex = indexes.get(key)
    if (typeof existingIndex === 'undefined') {
      indexes.set(key, merged.length)
      merged.push(item)
    } else {
      const existing = merged[existingIndex]
      merged[existingIndex] = {
        ...existing,
        title: existing.title || item.title,
        snippet: existing.snippet || item.snippet,
        source: existing.source || item.source
      }
    }
  }
  return merged.map((item, index) => ({ ...item, position: index + 1 }))
}

export function parseGoogleSerpContent(payload: unknown): ParsedSerpContent {
  const content = collectContent(payload)
  const failure = explicitFailure(content.text || content.markdown)
  if (failure) {
    return { results: [], parseFormat: 'unknown', parseStatus: 'failed', parseError: failure }
  }

  const structured = extractStructuredResults(payload)
  if (structured.recognized) {
    return {
      results: structured.results,
      parseFormat: 'structured',
      parseStatus: structured.results.length > 0 ? 'parsed' : 'empty',
      parseError: ''
    }
  }

  const embeddedJson = extractEmbeddedJson(payload)
  if (typeof embeddedJson !== 'undefined') {
    const parsed = extractStructuredResults(embeddedJson)
    if (parsed.recognized) {
      return {
        results: parsed.results,
        parseFormat: 'json',
        parseStatus: parsed.results.length > 0 ? 'parsed' : 'empty',
        parseError: ''
      }
    }
  }

  const markdownResults = parseMarkdownResults(content.markdown)
  const htmlResults = parseHtmlResults(content.html)
  if (content.markdown && content.html) {
    const results = mergeResults(markdownResults, htmlResults)
    return {
      results,
      parseFormat: 'markdown+html',
      parseStatus: results.length > 0 ? 'parsed' : 'empty',
      parseError: ''
    }
  }
  if (content.html) {
    return {
      results: htmlResults,
      parseFormat: 'html',
      parseStatus: htmlResults.length > 0 ? 'parsed' : 'empty',
      parseError: ''
    }
  }
  if (content.markdown) {
    return {
      results: markdownResults,
      parseFormat: 'markdown',
      parseStatus: markdownResults.length > 0 ? 'parsed' : 'empty',
      parseError: ''
    }
  }
  return {
    results: [],
    parseFormat: 'unknown',
    parseStatus: 'failed',
    parseError: 'Talordata response did not contain a supported Google result format'
  }
}
