import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Copy01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ArtifactBlockProps = {
  content: string
  /** Optional title or path (e.g. from ```artifact:path/to/file.tsx). */
  title?: string
  className?: string
}

/**
 * Renders an "artifact" code block: editable-looking code with copy and a clear label.
 * Use in markdown via ```artifact or ```artifact:path/to/file.tsx
 */
export function ArtifactBlock({
  content,
  title,
  className,
}: ArtifactBlockProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  const displayTitle = title ?? 'Artifact'
  const isSingleLine = content.split('\n').length === 1

  return (
    <div
      className={cn(
        'artifact-block group relative w-full max-w-full min-w-0 overflow-hidden rounded-lg border border-primary-200 bg-primary-50/50',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-primary-200 bg-primary-100/80 px-3 py-2">
        <span className="truncate text-xs font-medium text-primary-700">
          {displayTitle}
        </span>
        <Button
          variant="ghost"
          aria-label="Copy artifact"
          className="h-auto px-0 text-xs font-medium text-primary-600 hover:bg-transparent hover:text-primary-900"
          onClick={() => {
            handleCopy().catch(() => {})
          }}
        >
          <HugeiconsIcon
            icon={copied ? Tick02Icon : Copy01Icon}
            size={14}
            strokeWidth={1.8}
          />
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <pre
        className={cn(
          'overflow-x-auto text-sm text-primary-900',
          isSingleLine ? 'whitespace-pre px-3 py-2' : 'px-3 py-3',
        )}
      >
        <code className="block min-w-full font-mono">{content}</code>
      </pre>
    </div>
  )
}
