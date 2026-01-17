import * as React from "react"
import { useRouterState } from "@tanstack/react-router"

import { cn } from "@/lib/utils"

export function GlobalSpinner() {
  const isLoading = useRouterState({ select: (s) => s.status === "pending" })
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    if (isLoading) {
      setVisible(true)
    } else {
      // Small delay to ensure the animation finishes nicely
      timeout = setTimeout(() => setVisible(false), 500)
    }

    return () => clearTimeout(timeout)
  }, [isLoading])

  if (!visible) return null

  return (
    <div
      className={cn(
        "fixed top-0 left-0 z-[100] h-1 w-full bg-transparent overflow-hidden"
      )}
    >
      <div
        className={cn(
          "h-full w-full bg-primary/80 origin-left animate-progress"
        )}
      />
    </div>
  )
}
