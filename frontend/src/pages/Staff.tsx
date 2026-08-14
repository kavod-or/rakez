import {Box, Typography} from '@mui/material'

import {AppShell} from '../components/layout/AppShell'
import {Menu} from '../components/layout/Menu'
import {Panel} from '../components/layout/Panel'
import {ContentArea} from '../components/layout/ContentArea'

export function StaffPage() {
    return (
        <AppShell maxWidth={false}>
            <Menu/>
            <ContentArea>
                <Panel title="Staff" sx={{height: '100%'}}>

                </Panel>
            </ContentArea>
        </AppShell>
    )
}