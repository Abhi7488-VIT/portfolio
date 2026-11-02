/**
 * CommerceLensLab: the delivery finding, set as two giant figures, plus a working what-if.
 *
 * The slider only interpolates what the résumé states: halving late deliveries is estimated to
 * save ~1,700 low reviews. 0% to 50% maps linearly onto 0 to ~1,700 and the note says so.
 * Nothing is extrapolated past the stated scenario.
 */
import { useId, useState } from 'react'
import { commercelensData as d } from '../../content/content'
import { usePrefs } from '../../hooks/prefs'

export function CommerceLensCompare() {
  return (
    <div className="cl-compare">
      {[
        { value: d.lateLowReviewRate, label: 'of late orders got a 1-2 star review', tone: 'signal' },
        { value: d.onTimeLowReviewRate, label: 'of on-time orders did', tone: 'ink' },
      ].map((f) => (
        <figure key={f.label} className={`cl-figure cl-figure--${f.tone}`}>
          <p className="cl-figure__value display" data-cursor="data">
            <span data-reveal="count">{f.value}%</span>
          </p>
          <span className="cl-bar" aria-hidden="true">
            <span className="cl-bar__fill" data-reveal="wipe" style={{ width: `${f.value}%` }} />
          </span>
          <figcaption className="cl-figure__label">{f.label}</figcaption>
        </figure>
      ))}
    </div>
  )
}

export function CommerceLensWhatIf() {
  const [cut, setCut] = useState(50)
  const { reduced } = usePrefs()
  const id = useId()
  const saved = Math.round((d.halvedLateSaving * (cut / 50)) / 10) * 10
  const remaining = 1 - cut / 100

  return (
    <div className="cl-whatif" data-cursor="data">
      <label htmlFor={id} className="cl-whatif__label">
        Cut late deliveries by <output className="cl-whatif__pct" htmlFor={id}>{cut}%</output>
      </label>
      <input
        id={id}
        className="range"
        type="range"
        min={0}
        max={50}
        step={1}
        value={cut}
        onChange={(e) => setCut(Number(e.target.value))}
        aria-describedby={`${id}-note`}
        style={{ ['--fill' as string]: `${(cut / 50) * 100}%` }}
      />
      <p className="cl-whatif__result">
        <span className="cl-whatif__num display">≈{saved.toLocaleString('en-US')}</span>
        <span>fewer 1-2 star reviews</span>
      </p>
      <div className="cl-whatif__bars" aria-hidden="true">
        <span className="readout readout-label">Low reviews from late orders</span>
        <span className="cl-bar cl-bar--thin">
          <span
            className="cl-bar__fill cl-bar__fill--signal"
            style={{ transform: `scaleX(${remaining})`, transition: reduced ? 'none' : undefined }}
          />
        </span>
      </div>
      <p id={`${id}-note`} className="cl-whatif__note readout">
        {d.sliderNote}
      </p>
    </div>
  )
}
