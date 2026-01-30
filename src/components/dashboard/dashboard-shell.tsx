"use client"

import { CommandPalette, useCommandPalette } from "@/components/ui/command-palette"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const commandPalette = useCommandPalette()

  return (
    <>
      {children}
      <CommandPalette
        isOpen={commandPalette.isOpen}
        onClose={commandPalette.close}
      />
    </>
  )
}
