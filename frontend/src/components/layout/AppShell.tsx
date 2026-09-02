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
        height: '100svh',
        boxSizing: 'border-box',
        py: { xs: 2, sm: 4 },
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Container maxWidth={maxWidth} disableGutters={disableGutters} sx={{height: '100%', display: 'flex', flexDirection: 'column'}}>
        {children}
      </Container>
    </Box>
  )
}
