import { useEffect } from 'react'

type Handler = (e: KeyboardEvent) => void

export function useKeyboardShortcut(key: string, handler: Handler, deps: unknown[] = []) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const isTyping =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if (isTyping) return
      if (e.key.toLowerCase() === key.toLowerCase()) handler(e)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
