import {Box} from '@mui/material'

import {AppShell} from '../components/layout/AppShell'
import {Menu} from '../components/layout/Menu'
import {Panel} from "../components/layout/Panel.tsx";

export function StaffPage() {
    return (
        <AppShell maxWidth={false}>
            <Box sx={{minHeight: '80svh', display: 'flex'}}>
                <Menu/>
                <Box sx={{placeContent: 'start'}}>
                    <Panel>
                        Staff
                    </Panel>
                </Box>
            </Box>
        </AppShell>
    )
}