/**
 * Switch: the console's two-position toggle (theme, motion). A real button with role="switch".
 * The knob slides on the press curve (CSS transform); the value label re-enters on each change.
 */
import type { MouseEvent } from 'react'

interface SwitchProps {
  label: string
  offLabel: string
  onLabel: string
  checked: boolean
  onToggle: (e: MouseEvent<HTMLButtonElement>) => void
  hint?: string
}

export function Switch({ label, offLabel, onLabel, checked, onToggle, hint }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`${label}: ${checked ? onLabel : offLabel}`}
      title={hint}
      onClick={onToggle}
      className="switch readout"
    >
      <span className="switch__name">{label}</span>
      <span className="switch__track" aria-hidden="true">
        <span className="switch__knob" />
      </span>
      <span className="switch__value" aria-hidden="true">
        {/* key remounts the label so its entrance animation replays on every change */}
        <span key={checked ? 'on' : 'off'} className="switch__value-text">
          {checked ? onLabel : offLabel}
        </span>
      </span>
    </button>
  )
}
