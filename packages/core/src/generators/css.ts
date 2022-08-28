import { toCss, toKeyframeCss } from '@css-panda/atomic'
import { VarData } from '@css-panda/dictionary'
import { error } from '@css-panda/logger'
import { InternalContext } from '../create-context'

export function generateCss(ctx: InternalContext, root = ':where(:root, :host)') {
  function inner(vars: Map<string, VarData>, wrap = true) {
    const map = new Map<string, string>()

    for (const [key, { value }] of vars) {
      map.set(key, value)
    }

    const styleObj = Object.fromEntries(map)
    const { css } = wrap ? toCss({ [root]: styleObj }) : toCss(styleObj)

    return css
  }

  const output = [inner(ctx.dictionary.vars)]

  const { _conditions } = ctx.context()

  for (const [condition, conditionMap] of ctx.dictionary.conditionVars) {
    //
    const cond = _conditions.normalize(condition)
    const selector = cond.rawValue ?? cond.value.replace(/&/, root)

    if (!selector) {
      error(`Condition ${selector} is not defined`)
      continue
    }

    output.push(`${selector} {\n ${inner(conditionMap, cond.type === 'at-rule')} \n}`)
  }

  if (ctx.config.keyframes) {
    output.push(toKeyframeCss(ctx.config.keyframes))
  }

  return output.join('\n\n')
}