import type { ReactNode } from 'react'
import { Box, Container } from '@mui/material'
import type { ContainerProps } from '@mui/material'

type AppShellProps = {
  children: ReactNode
  maxWidth?: ContainerProps['maxWidth']
  disableGutters?: boolean
}

export function AppShell({ children, maxWidth = 'md', disableGutters = false }: AppShellProps) {
  return (
    <Box
      sx={{
        minHeight: '100svh',
        py: { xs: 2, sm: 4 },
      }}
    >
      <Container maxWidth={maxWidth} disableGutters={disableGutters}>
        {children}
      </Container>
    </Box>
  )
}
