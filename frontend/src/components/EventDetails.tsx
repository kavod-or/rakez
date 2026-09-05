import {useQuery} from '@tanstack/react-query'
import {Box, Stack, Typography} from '@mui/material'
import {getEvents, useActiveEventId} from '../api/client'
import type {EventItem} from '../api/client'

const formatDateTime = (value: string) => new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
}).format(new Date(value))

export function EventDetails() {
    const {data: events = []} = useQuery<EventItem[]>({
        queryKey: ['events'],
        queryFn: getEvents,
        retry: false,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    })
    const [activeEventId] = useActiveEventId()

    const activeEvent = events.find((event) => String(event.public_id || event.id) === activeEventId)

    if (!activeEvent) {
        return null
    }

    return (
        <Stack spacing={0.75} sx={{mt: 1.5}}>
            {activeEvent.display_pin && (
                <Box>
                    <Typography variant="caption" color="text.secondary">PIN</Typography>
                    <Typography variant="body2" sx={{fontFamily: 'monospace'}}>{activeEvent.display_pin}</Typography>
                </Box>
            )}
            <Box>
                <Typography variant="caption" color="text.secondary">Timezone</Typography>
                <Typography variant="body2">{activeEvent.timezone}</Typography>
            </Box>
            <Box>
                <Typography variant="caption" color="text.secondary">Starts</Typography>
                <Typography variant="body2">{formatDateTime(activeEvent.start)}</Typography>
            </Box>
            <Box>
                <Typography variant="caption" color="text.secondary">Ends</Typography>
                <Typography variant="body2">{formatDateTime(activeEvent.end)}</Typography>
            </Box>
            {activeEvent.description && (
                <Box>
                    <Typography variant="caption" color="text.secondary">Description</Typography>
                    <Typography variant="body2" sx={{overflowWrap: 'anywhere'}}>{activeEvent.description}</Typography>
                </Box>
            )}
        </Stack>
    )
}
