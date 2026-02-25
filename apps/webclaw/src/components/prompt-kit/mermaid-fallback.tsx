import { useEffect, useId, useState } from 'react'
import mermaid from 'mermaid'
import { cn } from '@/lib/utils'

type MermaidFallbackProps = {
  content: string
  className?: string
}

/** Renders ```mermaid code block content as a diagram. */
export function MermaidFallback({ content, className }: MermaidFallbackProps) {
  const id = useId().replace(/:/g, '-')
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setError(null)
    setSvg(null)

    const chart = content.trim()
    if (!chart) return

    const run = async () => {
      try {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
        })
        const { svg: result } = await mermaid.render(`mermaid-fallback-${id}`, chart)
        if (!cancelled) setSvg(result)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to render diagram')
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [content, id])

  if (error) {
    return (
      <div
        className={cn(
          'rounded-lg border border-primary-200 bg-primary-50/50 px-3 py-2 text-sm text-primary-700',
          className,
        )}
      >
        <span className="font-medium">Diagram: </span>
        {error}
      </div>
    )
  }

  if (!svg) {
    return (
      <div
        className={cn(
          'flex min-h-[120px] items-center justify-center rounded-lg border border-primary-200 bg-primary-50/30 text-sm text-primary-500',
          className,
        )}
      >
        Loading diagram…
      </div>
    )
  }

  return (
    <div
      className={cn('mermaid-fallback overflow-x-auto rounded-lg border border-primary-200 bg-primary-50/30 p-3', className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
