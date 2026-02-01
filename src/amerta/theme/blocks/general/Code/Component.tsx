import React from 'react'

import { Code } from './Component.client'

export type ThemeShopCodeBlockProps = {
  code: string
  language?: string
  blockType: 'code'
}

type Props = ThemeShopCodeBlockProps & {
  className?: string
}

export const ThemeShopCodeBlock: React.FC<Props> = ({ className, code, language }) => {
  return (
    <div className={[className, 'not-prose'].filter(Boolean).join(' ')}>
      <Code code={code} language={language} />
    </div>
  )
}
