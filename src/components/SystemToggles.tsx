/**
 * SystemToggles: theme (Console / Blueprint) and motion (full / reduced).
 * The theme wipe starts from the switch the visitor pressed.
 */
import { usePrefs } from '../hooks/prefs'
import { Switch } from './Switch'

export function SystemToggles({ className = '' }: { className?: string }) {
  const { theme, toggleTheme, reduced, setMotion } = usePrefs()
  return (
    <div className={`flex flex-nowrap items-center gap-xs sm:gap-md ${className}`}>
      <Switch
        label="Theme"
        offLabel="console"
        onLabel="blueprint"
        checked={theme === 'light'}
        onToggle={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          toggleTheme({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
        }}
      />
      <Switch
        label="Motion"
        offLabel="full"
        onLabel="reduced"
        checked={reduced}
        onToggle={() => setMotion(reduced ? 'full' : 'reduced')}
        hint="Swaps movement for simple fades"
      />
    </div>
  )
}
