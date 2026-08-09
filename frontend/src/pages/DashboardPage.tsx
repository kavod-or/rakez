import { Box, Typography } from '@mui/material'

import { AppShell } from '../components/layout/AppShell'
import { Panel } from '../components/layout/Panel'

export function DashboardPage() {
  return (
    <AppShell>
      <Box sx={{ minHeight: '80svh', display: 'grid', placeItems: 'center' }}>
        <Panel>
          <Typography variant="h4" component="h1" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1">
            You are logged in. Next step: build the events overview.
          </Typography>
        </Panel>
      </Box>
    </AppShell>
  )
}
