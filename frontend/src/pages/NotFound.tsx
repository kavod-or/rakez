import {Box, Button, Typography} from '@mui/material'
import {Link as RouterLink} from 'react-router-dom'

import {AppShell} from '../components/layout/AppShell'
import {Panel} from '../components/layout/Panel'

export function NotFoundPage() {
    return (
        <AppShell>
            <Box sx={{minHeight: '80svh', display: 'grid', placeItems: 'center'}}>
                <Panel>
                    <Box sx={{display: 'grid', gap: 1.5, justifyItems: 'center', textAlign: 'center'}}>
                        <Typography variant="h3" component="h1">
                            404
                        </Typography>
                        <Typography variant="h6">
                            This page went on a coffee break.
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            We checked under the keyboard. Nothing.
                        </Typography>
                        <Button component={RouterLink} to="/" variant="contained">
                            Take me home
                        </Button>
                    </Box>
                </Panel>
            </Box>
        </AppShell>
    )
}