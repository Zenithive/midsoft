'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type Option = 'option1' | 'option3'

interface OptionContextValue {
  option: Option
  setOption: (option: Option) => void
}

const OptionContext = createContext<OptionContextValue | undefined>(undefined)

export function OptionProvider({ children }: { children: ReactNode }) {
  const [option, setOption] = useState<Option>('option3')

  return (
    <OptionContext.Provider value={{ option, setOption }}>
      {children}
    </OptionContext.Provider>
  )
}

export function useOption() {
  const context = useContext(OptionContext)
  if (context === undefined) {
    throw new Error('useOption must be used within an OptionProvider')
  }
  return context
}