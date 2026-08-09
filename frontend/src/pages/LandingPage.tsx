import { Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Box, CircularProgress, Typography } from '@mui/material'

import { getCurrentUser } from '../api/client'
import { AppShell } from '../components/layout/AppShell'
import { Panel } from '../components/layout/Panel'

export function LandingPage() {
  const { data, isPending } = useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    retry: false,
  })

  if (isPending) {
    return (
      <AppShell>
        <Box
          sx={{
            minHeight: '70svh',
            display: 'grid',
            placeItems: 'center',
            gap: 2,
          }}
        >
          <Panel>
            <Box sx={{ display: 'grid', placeItems: 'center', gap: 2, py: 4 }}>
              <CircularProgress />
              <Typography variant="body1">Checking session...</Typography>
            </Box>
          </Panel>
        </Box>
      </AppShell>
    )
  }

  return <Navigate to={data ? '/dashboard' : '/login'} replace />
}
