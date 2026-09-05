import {useState} from 'react'
import {useQuery} from '@tanstack/react-query'
import {AppShell} from '../components/layout/AppShell'
import {Menu} from '../components/layout/Menu'
import {Panel} from "../components/layout/Panel"
import {ContentArea} from '../components/layout/ContentArea'
import {PanelDrawer} from '../components/layout/PanelDrawer'
import {getEvents, useActiveEventId} from '../api/client'
import type {EventItem} from '../api/client'

const panelDrawerStorageKey = 'dashboard-panel-drawer-open'

export function DashboardPage() {
    const [drawerOpen, setDrawerOpen] = useState(() => {
        if (typeof window === 'undefined') return false
        return window.localStorage.getItem(panelDrawerStorageKey) === '1'
    })
    const {data: events = []} = useQuery<EventItem[]>({
        queryKey: ['events'],
        queryFn: getEvents,
        retry: false,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    })
    const [activeEventId] = useActiveEventId()
    const activeEvent = events.find((event) => String(event.public_id || event.id) === activeEventId)

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
                    title={activeEvent ? activeEvent.name : 'Dashboard'}
                    rightDrawer={<PanelDrawer open={drawerOpen} onToggle={toggleDrawer}/>}
                    sx={{height: '100%'}}
                >
                </Panel>
            </ContentArea>
        </AppShell>
    )
}
