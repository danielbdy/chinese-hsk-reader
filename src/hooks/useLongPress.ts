import { useRef } from 'react'

const HOLD_MS = 450
const MOVE_TOLERANCE_PX = 10

/**
 * Pointer handlers that call `onPress` after a long press on touch screens or a click with a mouse.
 * The target element is found from the event, so one set of handlers can serve a whole article.
 */
export function useLongPress<T extends Element>(onPress: (target: T) => void, selector: string) {
  const timer = useRef<number | undefined>(undefined)
  const start = useRef({ x: 0, y: 0 })
  const pointerType = useRef('mouse')

  const clear = () => {
    window.clearTimeout(timer.current)
    timer.current = undefined
  }

  const find = (event: { target: EventTarget | null }) =>
    event.target instanceof Element ? (event.target.closest(selector) as T | null) : null

  return {
    onPointerDown(event: React.PointerEvent) {
      pointerType.current = event.pointerType
      if (event.pointerType === 'mouse') return
      const target = find(event)
      if (!target) return
      start.current = { x: event.clientX, y: event.clientY }
      clear()
      timer.current = window.setTimeout(() => {
        timer.current = undefined
        navigator.vibrate?.(10)
        onPress(target)
      }, HOLD_MS)
    },
    onPointerMove(event: React.PointerEvent) {
      if (timer.current === undefined) return
      const dx = event.clientX - start.current.x
      const dy = event.clientY - start.current.y
      if (Math.hypot(dx, dy) > MOVE_TOLERANCE_PX) clear()
    },
    onPointerUp: clear,
    onPointerCancel: clear,
    onClick(event: React.MouseEvent) {
      // Touch taps also fire click; only a mouse click opens a word, touch needs the long press.
      if (pointerType.current !== 'mouse') return
      const target = find(event)
      if (target) onPress(target)
    },
    onContextMenu(event: React.MouseEvent) {
      // Stop the browser's own long-press menu on words.
      if (find(event)) event.preventDefault()
    },
  }
}
