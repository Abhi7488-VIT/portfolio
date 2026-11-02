/**
 * Backdrop: the console's coordinate frame (grid) and film grain.
 * Static SVG pattern + one noise tile: zero per-frame cost. Decorative, hidden from assistive tech.
 */
export function Backdrop() {
  return (
    <>
      <svg className="backdrop-grid" aria-hidden="true" focusable="false">
        <defs>
          <pattern id="grid-minor" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" className="backdrop-grid__minor" />
          </pattern>
          <pattern id="grid-major" width="120" height="120" patternUnits="userSpaceOnUse">
            <rect width="120" height="120" fill="url(#grid-minor)" />
            <path d="M120 0H0V120" fill="none" className="backdrop-grid__major" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-major)" />
      </svg>
      <div className="grain" aria-hidden="true" />
    </>
  )
}
