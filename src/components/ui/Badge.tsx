import type { ReactNode } from 'react'

export function Badge({ children, color }: { children: ReactNode; color: 'green' | 'red' | 'yellow' | 'gray' }) {
  return <span className={`badge ${color}`}>{children}</span>
}
