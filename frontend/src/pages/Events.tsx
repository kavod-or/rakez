import {useEffect, useState} from 'react'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import {Box, CircularProgress, Typography} from '@mui/material'
import EventCard from '../components/EventCard'
import {patchEvent} from '../api/client'

import {AppShell} from '../components/layout/AppShell'
import {Menu} from '../components/layout/Menu'
import {Panel} from '../components/layout/Panel'
import {ContentArea} from '../components/layout/ContentArea'
import {getEvents} from '../api/client'
import type {EventItem} from '../api/client'

export function EventsPage() {
    const {data: events = [], isLoading, isError, error} = useQuery<EventItem[]>({
        queryKey: ['events'],
        queryFn: getEvents,
        retry: false,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    })

    const [activeEventId, setActiveEventId] = useState<string | null>(null)
    const queryClient = useQueryClient()

    const handleSave = async (id: number, data: {name: string; start: string; end: string; description?: string}) => {
        try {
            const updated = await patchEvent(id, data)
            queryClient.setQueryData<EventItem[] | undefined>(['events'], (old) => {
                if (!old) return old
                return old.map((e) => (e.id === id ? updated : e))
            })
        } catch (err) {
            console.error('Failed to save event', err)
        }
    }

    useEffect(() => {
        try {
            const stored = localStorage.getItem('active-event')
            if (stored) setActiveEventId(stored)
        } catch (e) {
            // ignore localStorage access errors (e.g., SSR or blocked storage)
        }
    }, [])

    const setActive = (id: string) => {
        setActiveEventId(id)
        try { localStorage.setItem('active-event', id) } catch {}
    }

    return (
        <AppShell maxWidth={false}>
            <Menu/>
            <ContentArea>
                <Panel title="Events" sx={{height: '100%', minWidth: 0}}>
                    {isLoading && (
                        <Box sx={{display: 'grid', placeItems: 'center', minHeight: 200}}>
                            <CircularProgress/>
                        </Box>
                    )}

                    {isError && (
                        <Typography color="error">{(error as Error)?.message ?? 'Failed to load events'}</Typography>
                    )}

                    {!isLoading && !isError && (
                        events.length === 0 ? (
                            <Typography color="text.secondary">No events found.</Typography>
                        ) : (
                            <Box sx={{
                                display: 'grid',
                                width: '100%',
                                minWidth: 0,
                                boxSizing: 'border-box',
                                gridTemplateColumns: {
                                    xs: '1fr',
                                    sm: 'repeat(2, minmax(0, 1fr))',
                                    xl: 'repeat(3, minmax(0, 1fr))',
                                },
                                gap: 2,
                                overflow: 'hidden',
                            }}>
                                {events.map((event) => {
                                    const id = event.public_id || event.id
                                    const isActive = activeEventId === id

                                    return (
                                        <EventCard
                                            key={id}
                                            event={event}
                                            isActive={isActive}
                                            onActivate={setActive}
                                            onSave={handleSave}
                                        />
                                    )
                                })}
                            </Box>
                        )
                    )}
                </Panel>
            </ContentArea>
        </AppShell>
    )
}
