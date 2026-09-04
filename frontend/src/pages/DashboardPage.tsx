import {AppShell} from '../components/layout/AppShell'
import {Menu} from '../components/layout/Menu'
import {Panel} from "../components/layout/Panel"
import {ContentArea} from '../components/layout/ContentArea'
import {ActiveEventSelector} from '../components/ActiveEventSelector'

export function DashboardPage() {
    return (
        <AppShell maxWidth={false}>
            <Menu/>
            <ContentArea>
                <Panel title="Dashboard" titleActions={<ActiveEventSelector />} sx={{height: '100%'}}>
                </Panel>
            </ContentArea>
        </AppShell>
    )
}

