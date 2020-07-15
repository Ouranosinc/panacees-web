import React from "react"
import { useState, useEffect, useCallback, ReactNode } from "react"

/** Component which gets the height remaining before the bottom of the window.
 * Useful for making something that needs a specific height fill the screen.
 */
export const FillHeight = (props: { children: (height: number) => ReactNode }) => {
  const [height, setHeight] = useState<number>()
  const [div, setDiv] = useState<HTMLDivElement | null>(null)

  const updateSize = useCallback(() => {
    if (!div) {
      return
    }

    // Get vertical position of self
    const vpos = div.getBoundingClientRect().top + window.scrollY

    // Get vertical space remaining
    const h = window.innerHeight - vpos

    // Limit to 50 at smallest
    setHeight(Math.max(h, 50))
  }, [div])

  useEffect(() => {
    // Listen for changes
    window.addEventListener('resize', updateSize)

    return () => {
      // Stop listening to resize events
      window.removeEventListener('resize', updateSize)
    }
  }, [])

  useEffect(() => {
    updateSize()
  }, [div])

  return <div ref={(node) => setDiv(node)}>
    { height ? props.children(height) : null }
  </div>
}