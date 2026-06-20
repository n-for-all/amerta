/* eslint-disable import/no-extraneous-dependencies */
 
import React from 'react'


import Icon from '../Icon'
import { ElementButton } from '@payloadcms/richtext-slate/client'


const baseClass = 'rich-text-large-body-button'

const ToolbarButton: React.FC<{ path: string }> = () => (
  <ElementButton className={baseClass} format="large-body">
    <Icon />
  </ElementButton>
)

export default ToolbarButton
