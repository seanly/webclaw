/**
 * Normalize LaTeX \begin{array}{...} column specifiers for KaTeX.
 * KaTeX does not support @{} or @{\quad} etc.; remove those so only l/c/r and | remain.
 */

type UnistNode = { type: string; children?: Array<UnistNode>; value?: string }
type UnistElement = UnistNode & {
  type: 'element'
  properties?: { className?: Array<string> }
  children: Array<UnistNode>
}

function getTextFromNode(node: UnistNode): string {
  if (node.type === 'text' && node.value != null) return node.value
  if (!node.children) return ''
  return node.children.map(getTextFromNode).join('')
}

function visitElements(
  node: UnistNode,
  visitor: (el: UnistElement) => void
): void {
  if (node.type === 'element' && Array.isArray(node.children)) {
    visitor(node as UnistElement)
  }
  if (node.children) {
    for (const child of node.children) visitElements(child, visitor)
  }
}

/** Remove @{...} fragments from array column specifier (e.g. r@{\quad}l -> rl). */
function normalizeArrayColumnSpecifier(spec: string): string {
  return spec.replace(/@\{\s*[^}]*\}/g, '')
}

/** Find the matching closing brace for the first { after start; start must be at a {. */
function findMatchingBrace(s: string, start: number): number {
  let depth = 1
  for (let i = start + 1; i < s.length; i++) {
    if (s[i] === '{') depth++
    else if (s[i] === '}') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

/**
 * Replace \begin{array}{...} column specifiers so that KaTeX-compatible
 * (only l, c, r, |). Handles nested braces in column spec (e.g. @{\hspace{1em}}).
 */
export function normalizeMathArrayLatex(latex: string): string {
  const prefix = '\\begin{array}{'
  let result = ''
  let pos = 0
  for (;;) {
    const idx = latex.indexOf(prefix, pos)
    if (idx === -1) {
      result += latex.slice(pos)
      break
    }
    result += latex.slice(pos, idx + prefix.length)
    const specStart = idx + prefix.length
    const specEnd = findMatchingBrace(latex, specStart - 1)
    if (specEnd === -1) {
      result += latex.slice(specStart)
      break
    }
    const spec = latex.slice(specStart, specEnd)
    result += normalizeArrayColumnSpecifier(spec)
    result += '}'
    pos = specEnd + 1
  }
  return result
}

/**
 * Rehype plugin that runs before rehype-katex and normalizes math node content
 * so that \begin{array}{r@{\quad}l} etc. become \begin{array}{rl}.
 */
export function rehypeNormalizeMathArray() {
  return function transform(tree: UnistNode) {
    visitElements(tree, (node) => {
      const classes = Array.isArray(node.properties?.className)
        ? (node.properties.className)
        : []
      const isMath =
        classes.includes('language-math') ||
        classes.includes('math-display') ||
        classes.includes('math-inline')
      if (!isMath) return

      const value = getTextFromNode(node)
      const normalized = normalizeMathArrayLatex(value)
      if (normalized === value) return

      node.children = [{ type: 'text', value: normalized }]
    })
  }
}
