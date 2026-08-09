import { useEffect, useRef, useState, type ReactNode } from 'react'

interface DeferredViewProps {
  children: ReactNode
  fallback?: ReactNode
  /** Minimum height to reserve before the component mounts, preventing CLS */
  minHeight?: number
  /** Root margin for IntersectionObserver — positive values trigger earlier */
  rootMargin?: string
}

export function DeferredView({
  children,
  fallback,
  minHeight = 200,
  rootMargin = '200px',
}: DeferredViewProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // If IntersectionObserver isn't available, show immediately
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [rootMargin])

  if (visible) return <>{children}</>

  return (
    <div ref={ref} style={{ minHeight }}>
      {fallback ?? null}
    </div>
  )
}
