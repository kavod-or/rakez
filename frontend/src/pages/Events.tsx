import {useEffect, useState} from 'react'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import {Autocomplete, Box, Button, CircularProgress, Fab, IconButton, Stack, TextField, Typography} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined'
import EventCard from '../components/EventCard'
import {createEvent, deleteEvent, getCurrentUser, getEvents, patchEvent, useActiveEventId} from '../api/client'

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
    timezone: string
    pin?: string
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

function canCreateEvent(currentUser: CurrentUser | null | undefined) {
    return currentUser?.roles.some((role) => role.scope === 'global' && role.role === 'global_manager') ?? false
}

function getBrowserTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

const timezoneOptions = Intl.supportedValuesOf('timeZone')

function EventEditDialog({event, canDelete, onClose, onSave, onDelete}: {
    event: EventItem | null
    canDelete: boolean
    onClose: () => void
    onSave: (id: number, data: EventUpdate) => Promise<void>
    onDelete: (event: EventItem) => Promise<void>
}) {
    const [name, setName] = useState('')
    const [start, setStart] = useState<Dayjs | null>(null)
    const [end, setEnd] = useState<Dayjs | null>(null)
    const [timezone, setTimezone] = useState('')
    const [pin, setPin] = useState('')
    const [description, setDescription] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        setName(event?.name ?? '')
        setStart(event?.start ? dayjs(event.start) : null)
        setEnd(event?.end ? dayjs(event.end) : null)
        setTimezone(event?.timezone ?? '')
        setPin('')
        setDescription(event?.description ?? '')
        setError(null)
        setDeleteConfirmationOpen(false)
    }, [event])

    const save = async () => {
        if (!event || !name.trim() || !start || !end || !timezone) return
        if (!end.isAfter(start)) {
            setError('Event end must be after event start.')
            return
        }
        if (pin && pin.length !== 6) {
            setError('PIN must be exactly 6 characters.')
            return
        }
        await onSave(event.id, {
            name: name.trim(),
            start: start.toDate().toISOString(),
            end: end.toDate().toISOString(),
            timezone,
            ...(pin ? {pin} : {}),
            description,
        })
        onClose()
    }

    const deleteEvent = async () => {
        if (!event) return
        setIsDeleting(true)
        setError(null)
        try {
            await onDelete(event)
            setDeleteConfirmationOpen(false)
            onClose()
        } catch (err) {
            setDeleteConfirmationOpen(false)
            setError(err instanceof Error ? err.message : 'Failed to delete event')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <>
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
                <Autocomplete
                    options={timezoneOptions}
                    value={timezone}
                    onChange={(_, value) => setTimezone(value ?? '')}
                    renderInput={(params) => <TextField {...params} label="Timezone" fullWidth/>}
                />
                <TextField
                    label="New PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    helperText="Leave blank to keep the current PIN."
                    inputProps={{maxLength: 6}}
                    fullWidth
                />
                <TextField
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    multiline
                    minRows={3}
                    fullWidth
                />
                {canDelete && (
                    <Button
                        color="error"
                        variant="outlined"
                        size="small"
                        startIcon={<DeleteOutlineOutlined/>}
                        onClick={() => setDeleteConfirmationOpen(true)}
                        sx={{alignSelf: 'flex-start'}}
                    >
                        Delete event
                    </Button>
                )}
                {error && <Typography color="error" variant="body2">{error}</Typography>}
                </Stack>
            </LocalizationProvider>
        </DetailDialog>
        <DetailDialog
            open={deleteConfirmationOpen}
            onClose={() => setDeleteConfirmationOpen(false)}
            maxWidth="xs"
            title="Delete event"
            footer={
                <>
                    <Button onClick={() => setDeleteConfirmationOpen(false)} color="inherit">Cancel</Button>
                    <Button onClick={() => void deleteEvent()} color="error" variant="contained" disabled={isDeleting}>
                        {isDeleting ? 'Deleting…' : 'Delete'}
                    </Button>
                </>
            }
        >
            <Typography variant="body1">
                This will permanently delete the event and all of its linked shifts and assignments.
            </Typography>
        </DetailDialog>
        </>
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

    const [activeEventId, setActiveEventId] = useActiveEventId()
    const queryClient = useQueryClient()
    const [editingEvent, setEditingEvent] = useState<EventItem | null>(null)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [createName, setCreateName] = useState('')
    const [createStart, setCreateStart] = useState<Dayjs | null>(dayjs())
    const [createEnd, setCreateEnd] = useState<Dayjs | null>(dayjs().add(2, 'hour'))
    const [createDescription, setCreateDescription] = useState('')
    const [createPin, setCreatePin] = useState('')
    const [createTimezone, setCreateTimezone] = useState(getBrowserTimezone())
    const [createError, setCreateError] = useState<string | null>(null)
    const [isCreatingEvent, setIsCreatingEvent] = useState(false)

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

    const handleDeleteEvent = async (event: EventItem) => {
        await deleteEvent(event.id)
        queryClient.setQueryData<EventItem[] | undefined>(['events'], (old) => old?.filter((item) => item.id !== event.id))
        if (activeEventId === getEventId(event)) {
            setActiveEventId(null)
        }
    }

    const openCreateDialog = () => {
        setCreateName('')
        setCreateStart(dayjs())
        setCreateEnd(dayjs().add(2, 'hour'))
        setCreateDescription('')
        setCreatePin('')
        setCreateTimezone(getBrowserTimezone())
        setCreateError(null)
        setCreateDialogOpen(true)
    }

    const handleCreateEvent = async () => {
        const name = createName.trim()
        const pin = createPin.trim()
        const timezone = createTimezone.trim()

        if (!name) {
            setCreateError('Please enter an event name.')
            return
        }
        if (!createStart || !createEnd) {
            setCreateError('Please set event start and end.')
            return
        }
        if (!createEnd.isAfter(createStart)) {
            setCreateError('Event end must be after event start.')
            return
        }
        if (pin.length !== 6) {
            setCreateError('PIN must be exactly 6 characters.')
            return
        }
        if (!timezone) {
            setCreateError('Please enter a timezone.')
            return
        }

        setIsCreatingEvent(true)
        setCreateError(null)

        try {
            const created = await createEvent({
                name,
                start: createStart.toDate().toISOString(),
                end: createEnd.toDate().toISOString(),
                timezone,
                description: createDescription,
                pin,
            })
            queryClient.setQueryData<EventItem[] | undefined>(['events'], (old) => [...(old ?? []), created])
            setCreateDialogOpen(false)
            setActiveEventId(getEventId(created))
        } catch (err) {
            setCreateError(err instanceof Error ? err.message : 'Failed to create event')
        } finally {
            setIsCreatingEvent(false)
        }
    }

    const setActive = (id: string) => {
        setActiveEventId(id)
    }

    return (
        <AppShell maxWidth={false}>
            <Menu/>
            <ContentArea>
                <Panel title="Events" sx={{height: '100%', minWidth: 0, position: 'relative'}}>
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
                            <Typography color="text.secondary">No events found. Create one with the plus button below.</Typography>
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

                    {canCreateEvent(currentUser) && (
                        <Fab
                            color="primary"
                            aria-label="Add event"
                            sx={{position: 'absolute', right: 24, bottom: 24}}
                            onClick={openCreateDialog}
                        >
                            <AddIcon/>
                        </Fab>
                    )}
                </Panel>
            </ContentArea>

            <DetailDialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                maxWidth="sm"
                title="Create event"
                footer={
                    <>
                        <Button onClick={() => setCreateDialogOpen(false)} color="inherit">Cancel</Button>
                        <Button onClick={() => void handleCreateEvent()} variant="contained" disabled={isCreatingEvent || !createName.trim() || !createStart || !createEnd || !createEnd.isAfter(createStart) || createPin.trim().length !== 6 || !createTimezone.trim()}>
                            {isCreatingEvent ? 'Creating…' : 'Create'}
                        </Button>
                    </>
                }
            >
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Stack spacing={2} sx={{pt: 1}}>
                        <TextField
                            label="Event name"
                            value={createName}
                            onChange={(e) => setCreateName(e.target.value)}
                            fullWidth
                            autoFocus
                        />
                        <Box sx={{display: 'grid', gap: 1.5, gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}}}>
                            <DateTimePicker
                                label="Starts"
                                value={createStart}
                                onChange={setCreateStart}
                                slotProps={{textField: {size: 'small', fullWidth: true, sx: dateTimeFieldSx}, field: {clearable: false}}}
                            />
                            <DateTimePicker
                                label="Ends"
                                value={createEnd}
                                onChange={setCreateEnd}
                                slotProps={{textField: {size: 'small', fullWidth: true, sx: dateTimeFieldSx}, field: {clearable: false}}}
                            />
                        </Box>
                        <Autocomplete
                            options={timezoneOptions}
                            value={createTimezone}
                            onChange={(_, value) => setCreateTimezone(value ?? '')}
                            renderInput={(params) => <TextField {...params} label="Timezone" fullWidth/>}
                        />
                        <TextField
                            label="PIN"
                            value={createPin}
                            onChange={(e) => setCreatePin(e.target.value)}
                            helperText="Exactly 6 characters"
                            inputProps={{maxLength: 6}}
                            fullWidth
                        />
                        <TextField
                            label="Description"
                            value={createDescription}
                            onChange={(e) => setCreateDescription(e.target.value)}
                            multiline
                            minRows={3}
                            fullWidth
                        />
                        {createError && (
                            <Typography color="error" variant="body2">{createError}</Typography>
                        )}
                    </Stack>
                </LocalizationProvider>
            </DetailDialog>

            <EventEditDialog
                event={editingEvent}
                canDelete={canCreateEvent(currentUser)}
                onClose={() => setEditingEvent(null)}
                onSave={handleSave}
                onDelete={handleDeleteEvent}
            />
        </AppShell>
    )
}
