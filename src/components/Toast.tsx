/**
 * Toast: short confirmations (copied email, easter eggs). One at a time, announced politely to
 * screen readers. Enters with a CSS rise on the expo curve, leaves on the exit curve.
 */
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

interface ToastApi {
  show: (message: string, opts?: { tone?: 'ok' | 'info'; ms?: number }) => void
}
const ToastContext = createContext<ToastApi>({ show: () => {} })

const EXIT_MS = 200

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string; tone: 'ok' | 'info'; leaving: boolean } | null>(null)
  const timers = useRef<number[]>([])

  const show = useCallback<ToastApi['show']>((message, opts = {}) => {
    timers.current.forEach((t) => window.clearTimeout(t))
    setToast({ id: Date.now(), message, tone: opts.tone ?? 'ok', leaving: false })
    const ms = opts.ms ?? 2600
    timers.current = [
      window.setTimeout(() => setToast((t) => (t ? { ...t, leaving: true } : t)), ms),
      window.setTimeout(() => setToast(null), ms + EXIT_MS),
    ]
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div key={toast.id} className="toast readout" data-tone={toast.tone} data-leaving={toast.leaving || undefined}>
            <span className="toast__mark" aria-hidden="true" />
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
