import {Box} from '@mui/material'

import {AppShell} from '../components/layout/AppShell'
import {Menu} from '../components/layout/Menu'
import {FooterBar} from '../components/layout/FooterBar'

export function DashboardPage() {
    return (
        <AppShell maxWidth={false} disableGutters>
            <Box sx={{minHeight: '80svh', display: 'flex'}}>
                <Menu/>
            </Box>
        </AppShell>
    )
}
