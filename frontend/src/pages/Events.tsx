
import {useQuery} from '@tanstack/react-query'
import {Box, Card, CardContent, Chip, CircularProgress, Stack, Typography} from '@mui/material'

import {AppShell} from '../components/layout/AppShell'
import {Menu} from '../components/layout/Menu'
import {Panel} from '../components/layout/Panel'
import {ContentArea} from '../components/layout/ContentArea'
import {getEvents} from '../api/client'
import type {EventItem} from '../api/client'

const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value))

export function EventsPage() {
    const {data: events = [], isLoading, isError, error} = useQuery<EventItem[]>({
        queryKey: ['events'],
        queryFn: getEvents,
        retry: false,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    })

    return (
        <AppShell maxWidth={false}>
            <Menu/>
            <ContentArea>
                <Panel title="Events" sx={{height: '100%'}}>
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
                                gridTemplateColumns: {
                                    xs: '1fr',
                                    sm: 'repeat(2, minmax(0, 1fr))',
                                    xl: 'repeat(3, minmax(0, 1fr))',
                                },
                                gap: 2,
                            }}>
                                {events.map((event) => (
                                    <Card key={event.public_id || event.id} sx={{height: '100%'}}>
                                        <CardContent sx={{display: 'flex', flexDirection: 'column', height: '100%', gap: 1.5}}>
                                            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1}}>
                                                <Typography variant="h6" sx={{fontWeight: 600}}>{event.name}</Typography>
                                                <Chip label={event.timezone} size="small" variant="outlined" />
                                            </Box>

                                            <Stack spacing={0.5}>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">Starts</Typography>
                                                    <Typography variant="body2">{formatDateTime(event.start)}</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">Ends</Typography>
                                                    <Typography variant="body2">{formatDateTime(event.end)}</Typography>
                                                </Box>
                                            </Stack>

                                            {event.description && (
                                                <Typography variant="body2" color="text.secondary" sx={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}>
                                                    {event.description}
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        )
                    )}
                </Panel>
            </ContentArea>
        </AppShell>
    )
}
