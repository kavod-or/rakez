import {useQuery} from '@tanstack/react-query'
import {Box, Chip, FormControl, MenuItem, Select, Typography} from '@mui/material'
import {getEvents, useActiveEventId} from '../api/client'
import type {EventItem} from '../api/client'

export function ActiveEventSelector({fullWidth = false}: {fullWidth?: boolean}) {
    const {data: events = [], isLoading} = useQuery<EventItem[]>({
        queryKey: ['events'],
        queryFn: getEvents,
        retry: false,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    })

    const [activeEventId, setActiveEventId] = useActiveEventId()

    const activeEvent = events.find((e) => String(e.public_id || e.id) === activeEventId)

    return (
        <FormControl size="small" fullWidth={fullWidth} sx={fullWidth ? undefined : {minWidth: 180, maxWidth: 320}}>
            <Select
                value={activeEvent ? String(activeEvent.public_id || activeEvent.id) : ''}
                onChange={(e) => setActiveEventId(e.target.value || null)}
                displayEmpty
                disabled={isLoading || events.length === 0}
                aria-label="Select active event"
                sx={{
                    height: 36,
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: 2,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    '& .MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        py: 0.5,
                        px: 1.25,
                    },
                    '& fieldset': {
                        borderColor: 'rgba(148, 163, 184, 0.25)',
                    },
                    '&:hover fieldset': {
                        borderColor: 'rgba(68, 167, 143, 0.7)',
                    },
                    '&.Mui-focused fieldset': {
                        borderColor: '#44A78F',
                    },
                }}
                renderValue={(selected) => {
                    if (!selected || !activeEvent) {
                        return (
                            <Typography variant="body2" color="text.secondary">
                                Select active event...
                            </Typography>
                        )
                    }
                    return (
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden'}}>
                            <Chip
                                label="Active"
                                size="small"
                                color="primary"
                                sx={{height: 20, fontSize: '0.7rem', fontWeight: 700, px: 0.5, flexShrink: 0}}
                            />
                            <Typography
                                variant="body2"
                                sx={{fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}
                            >
                                {activeEvent.name}
                            </Typography>
                        </Box>
                    )
                }}
            >
                <MenuItem value="">
                    <Typography variant="body2" color="text.secondary">
                        <em>None (No active event)</em>
                    </Typography>
                </MenuItem>
                {events.map((event) => {
                    const id = String(event.public_id || event.id)
                    const isSelected = id === activeEventId
                    return (
                        <MenuItem key={id} value={id}>
                            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1.5}}>
                                <Typography variant="body2" sx={{fontWeight: isSelected ? 600 : 400}}>
                                    {event.name}
                                </Typography>
                                {isSelected && (
                                    <Chip label="Active" size="small" color="primary" sx={{height: 18, fontSize: '0.65rem', fontWeight: 700}} />
                                )}
                            </Box>
                        </MenuItem>
                    )
                })}
            </Select>
        </FormControl>
    )
}
