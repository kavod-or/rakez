import {useEffect, useState} from 'react'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import {Box, CircularProgress, IconButton, Stack, TextField, Typography} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import EventCard from '../components/EventCard'
import {getCurrentUser, getEvents, patchEvent} from '../api/client'

import {AppShell} from '../components/layout/AppShell'
import {Menu} from '../components/layout/Menu'
import {Panel} from '../components/layout/Panel'
import {ContentArea} from '../components/layout/ContentArea'
import type {EventItem, CurrentUser} from '../api/client'
import {DetailDialog} from '../components/ui/DetailDialog'
import dayjs, {type Dayjs} from 'dayjs'
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs'
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider'
import {DateTimePicker} from '@mui/x-date-pickers/DateTimePicker'

const dateTimeFieldSx = {
    '& .MuiInputLabel-root': {
        color: '#94A3B8',
    },
    '& .MuiInputLabel-root.Mui-focused': {
        color: '#44A78F',
    },
    '& .MuiOutlinedInput-root': {
        backgroundColor: '#0f172a',
        color: '#E5EEFC',
        minHeight: 34,
        '& .MuiInputBase-input': {
            padding: '7px 10px',
            fontSize: '0.875rem',
        },
        '& fieldset': {
            borderColor: 'rgba(148, 163, 184, 0.28)',
        },
        '&:hover fieldset': {
            borderColor: 'rgba(68, 167, 143, 0.7)',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#44A78F',
            borderWidth: 1,
        },
    },
}

type EventUpdate = {
    name: string
    start: string
    end: string
    description?: string
}

const eventGridSx = {
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
}

function getEventId(event: EventItem) {
    return String(event.public_id || event.id)
}

function canEditEvent(event: EventItem, currentUser: CurrentUser | null | undefined) {
    return currentUser?.roles.some((role) =>
        (role.scope === 'global' && role.role === 'global_manager')
        || (role.scope === 'event' && role.role === 'event_manager' && role.target.id === String(event.public_id)),
    ) ?? false
}

function EventEditDialog({event, onClose, onSave}: {
    event: EventItem | null
    onClose: () => void
    onSave: (id: number, data: EventUpdate) => Promise<void>
}) {
    const [name, setName] = useState('')
    const [start, setStart] = useState<Dayjs | null>(null)
    const [end, setEnd] = useState<Dayjs | null>(null)
    const [description, setDescription] = useState('')

    useEffect(() => {
        setName(event?.name ?? '')
        setStart(event?.start ? dayjs(event.start) : null)
        setEnd(event?.end ? dayjs(event.end) : null)
        setDescription(event?.description ?? '')
    }, [event])

    const save = async () => {
        if (!event || !name.trim() || !start || !end) return
        await onSave(event.id, {name: name.trim(), start: start.toDate().toISOString(), end: end.toDate().toISOString(), description})
        onClose()
    }

    return (
        <DetailDialog
            open={Boolean(event)}
            onClose={onClose}
            maxWidth="sm"
            contentSx={{pb: 2}}
            title={
                <TextField
                    label="Event name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    size="small"
                    fullWidth
                />
            }
            titleActions={
                <Stack direction="row" spacing={0.5}>
                    <IconButton color="primary" aria-label="Save event" onClick={() => void save()} size="small">
                        <CheckIcon fontSize="small"/>
                    </IconButton>
                    <IconButton aria-label="Close event dialog" onClick={onClose} size="small">
                        <CloseIcon fontSize="small"/>
                    </IconButton>
                </Stack>
            }
        >
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Stack spacing={2}>
                <Box sx={{display: 'grid', gap: 1.5, gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}}}>
                    <DateTimePicker
                        label="Starts"
                        value={start}
                        onChange={setStart}
                        slotProps={{textField: {size: 'small', fullWidth: true, sx: dateTimeFieldSx}, field: {clearable: false}}}
                    />
                    <DateTimePicker
                        label="Ends"
                        value={end}
                        onChange={setEnd}
                        slotProps={{textField: {size: 'small', fullWidth: true, sx: dateTimeFieldSx}, field: {clearable: false}}}
                    />
                </Box>
                <TextField
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    multiline
                    minRows={3}
                    fullWidth
                />
                </Stack>
            </LocalizationProvider>
        </DetailDialog>
    )
}

export function EventsPage() {
    const {data: events = [], isLoading, isError, error} = useQuery<EventItem[]>({
        queryKey: ['events'],
        queryFn: getEvents,
        retry: false,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    })
    const {data: currentUser} = useQuery<CurrentUser | null>({
        queryKey: ['current-user'],
        queryFn: getCurrentUser,
        retry: false,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    })

    const [activeEventId, setActiveEventId] = useState<string | null>(null)
    const queryClient = useQueryClient()
    const [editingEvent, setEditingEvent] = useState<EventItem | null>(null)

    const handleSave = async (id: number, data: EventUpdate) => {
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
                            <Box sx={eventGridSx}>
                                {events.map((event) => {
                                    const id = getEventId(event)
                                    const isActive = activeEventId === id
                                    return (
                                        <EventCard
                                            key={id}
                                            event={event}
                                            isActive={isActive}
                                            canEdit={canEditEvent(event, currentUser)}
                                            onActivate={setActive}
                                            onEdit={setEditingEvent}
                                        />
                                    )
                                })}
                            </Box>
                        )
                    )}
                </Panel>
            </ContentArea>
            <EventEditDialog event={editingEvent} onClose={() => setEditingEvent(null)} onSave={handleSave}/>
        </AppShell>
    )
}
