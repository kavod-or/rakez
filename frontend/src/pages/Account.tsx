import {Box, Typography} from '@mui/material'

import {AppShell} from '../components/layout/AppShell'
import {Menu} from '../components/layout/Menu'
import {Panel} from "../components/layout/Panel.tsx";

export function AccountPage() {
    return (
        <AppShell maxWidth={false}>
            <Menu/>
            <Box sx={{minHeight: '80svh', display: 'grid', placeItems: 'center'}}>
                <Panel>
                    <Box sx={{display: 'grid', gap: 1.5, justifyItems: 'center', textAlign: 'center'}}>
                        <Typography variant="h3" component="h1">
                            Account
                        </Typography>
                        <Typography variant="h6">
                            Your account will show up soon
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Yeah, really it will
                        </Typography>
                    </Box>
                </Panel>
            </Box>
        </AppShell>
    )
}