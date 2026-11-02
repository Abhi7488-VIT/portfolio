/**
 * Features: the "wow" layer, loaded as its own chunk after the page settles.
 * Command palette, résumé chat, CI pipeline dock with the console log, and the easter eggs.
 * Framer Motion lives only in this chunk, so it never weighs on the first paint.
 */
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react'
import { usePrefs } from '../../hooks/prefs'
import { CommandPalette } from './CommandPalette'
import { ChatWidget } from './ChatWidget'
import { PipelineDock } from './PipelineDock'
import { EasterEggs } from './EasterEggs'

export default function Features() {
  const { reduced } = usePrefs()
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion={reduced ? 'always' : 'never'}>
        <PipelineDock />
        <ChatWidget />
        <CommandPalette />
        <EasterEggs />
      </MotionConfig>
    </LazyMotion>
  )
}
