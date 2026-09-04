import {useState} from 'react'
import {AppShell} from '../components/layout/AppShell'
import {Menu} from '../components/layout/Menu'
import {Panel} from "../components/layout/Panel"
import {ContentArea} from '../components/layout/ContentArea'
import {PanelDrawer} from '../components/layout/PanelDrawer'

const panelDrawerStorageKey = 'dashboard-panel-drawer-open'

export function DashboardPage() {
    const [drawerOpen, setDrawerOpen] = useState(() => {
        if (typeof window === 'undefined') return false
        return window.localStorage.getItem(panelDrawerStorageKey) === '1'
    })

    const toggleDrawer = () => {
        setDrawerOpen((prev) => {
            const next = !prev
            window.localStorage.setItem(panelDrawerStorageKey, next ? '1' : '0')
            return next
        })
    }

    return (
        <AppShell maxWidth={false}>
            <Menu/>
            <ContentArea>
                <Panel
                    title="Dashboard"
                    rightDrawer={<PanelDrawer open={drawerOpen} onToggle={toggleDrawer}/>}
                    sx={{height: '100%'}}
                >
                </Panel>
            </ContentArea>
        </AppShell>
    )
}
