import { useEffect } from 'react'
import { useLockinStore } from '@/store/useLockinStore'

export function useTheme() {
  const theme = useLockinStore((s) => s.settings.theme)

  useEffect(() => {
    const root = document.documentElement
    function apply(mode: 'dark' | 'light') {
      root.setAttribute('data-theme', mode)
    }

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: light)')
      apply(mq.matches ? 'light' : 'dark')
      const listener = (e: MediaQueryListEvent) => apply(e.matches ? 'light' : 'dark')
      mq.addEventListener('change', listener)
      return () => mq.removeEventListener('change', listener)
    } else {
      apply(theme)
    }
  }, [theme])
}
