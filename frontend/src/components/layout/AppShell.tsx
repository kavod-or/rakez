import type { ReactNode } from 'react'
import { Box, Container } from '@mui/material'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <Box
      sx={{
        minHeight: '100svh',
        py: { xs: 2, sm: 4 },
      }}
    >
      <Container maxWidth="md">{children}</Container>
    </Box>
  )
}
