
import {AppShell} from '../components/layout/AppShell'
import {Menu} from '../components/layout/Menu'
import {Panel} from '../components/layout/Panel'
import {ContentArea} from '../components/layout/ContentArea'

export function AccountPage() {
    return (
        <AppShell maxWidth={false}>
            <Menu/>
            <ContentArea>
                <Panel title="Account" sx={{height: '100%'}}>
                   
                </Panel>
            </ContentArea>
        </AppShell>
    )
}