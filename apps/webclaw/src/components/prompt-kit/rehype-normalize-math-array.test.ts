import { describe, expect, it } from 'vitest'
import { normalizeMathArrayLatex } from './rehype-normalize-math-array'

describe('normalizeMathArrayLatex', function () {
  it('strips @{\\quad} from array column specifier', function () {
    const input = '\\begin{array}{r@{\\quad}l} 12.5 & \\leftarrow \\text{巧克力} \\\\ +\\ 8.3 & \\leftarrow \\text{草莓} \\\\ \\hline 20.8 & \\leftarrow \\text{一共} \\end{array}'
    const out = normalizeMathArrayLatex(input)
    expect(out).toContain('\\begin{array}{rl}')
    expect(out).not.toContain('@{\\quad}')
  })

  it('strips @{} from array column specifier', function () {
    const input = '\\begin{array}{r@{}l} a & b \\end{array}'
    expect(normalizeMathArrayLatex(input)).toBe('\\begin{array}{rl} a & b \\end{array}')
  })

  it('leaves array without @ specifiers unchanged', function () {
    const input = '\\begin{array}{cc} a & b \\\\ c & d \\end{array}'
    expect(normalizeMathArrayLatex(input)).toBe(input)
  })

  it('leaves non-array LaTeX unchanged', function () {
    const input = 'E = mc^2'
    expect(normalizeMathArrayLatex(input)).toBe(input)
  })

  it('normalizes multiple array blocks', function () {
    const input =
      '\\begin{array}{c@{\\quad}c} 1 \\end{array} and \\begin{array}{r@{\\quad}l} x \\end{array}'
    const out = normalizeMathArrayLatex(input)
    expect(out).toContain('\\begin{array}{cc}')
    expect(out).toContain('\\begin{array}{rl}')
  })
})
