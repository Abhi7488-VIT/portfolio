/**
 * kb.ts: answers questions from the local résumé knowledge base (content.ts). No network, no model.
 *
 * Scoring per entry: a multi-word keyword found as a phrase scores 2, a whole-word keyword 1, and a
 * close plural or singular ("roles" ~ "role") 0.5. The best entry wins if it scores at least 1;
 * otherwise the fallback is returned. On a tie, the entry matched by topic words beats one matched
 * only by a project name; remaining ties keep content order.
 */
import { knowledgeBase, chat, type KbEntry } from '../content/content'

const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9+#.\- ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export interface KbAnswer {
  text: string
  link?: KbEntry['link']
  matched: string | null
}

/** Project names say which project, not what about it: they break ties last. */
const CONTEXT = new Set(['agentflow', 'commercelens', 'nse', 'ortect'])

/** "roles" ~ "role", "certificates" ~ "certificate"; never "what" ~ "what-if". */
const near = (w: string, k: string) =>
  k.length >= 4 && w.length >= 4 && ((w.startsWith(k) && w.length - k.length <= 3) || (k.startsWith(w) && w.length >= 5 && k.length - w.length <= 2))

export function answer(question: string): KbAnswer {
  const q = normalise(question)
  const words = q.split(' ').map((w) => w.replace(/[.?]+$/, ''))
  let best: KbEntry | null = null
  let bestScore = 0
  let bestSpecific = 0
  for (const entry of knowledgeBase) {
    let score = 0
    let specific = 0
    for (const raw of entry.keywords) {
      const k = normalise(raw)
      let s = 0
      if (k.includes(' ')) s = q.includes(k) ? 2 : 0
      else if (words.includes(k)) s = 1
      else if (words.some((w) => near(w, k))) s = 0.5
      score += s
      if (!CONTEXT.has(k)) specific += s
    }
    if (score > bestScore || (score === bestScore && score > 0 && specific > bestSpecific)) {
      bestScore = score
      bestSpecific = specific
      best = entry
    }
  }
  if (!best || bestScore < 1) return { text: chat.fallback, matched: null }
  return { text: best.answer, link: best.link, matched: best.id }
}
