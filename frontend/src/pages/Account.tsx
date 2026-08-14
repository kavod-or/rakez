import {Box, CircularProgress, Typography, Avatar, Chip, Button} from '@mui/material'
import {useQuery} from '@tanstack/react-query'
import {Link as RouterLink} from 'react-router-dom'

import {AppShell} from '../components/layout/AppShell'
import {Menu} from '../components/layout/Menu'
import {Panel} from '../components/layout/Panel'
import {ContentArea} from '../components/layout/ContentArea'
import {getCurrentUser} from '../api/client'
import type {CurrentUser} from '../api/client'

export function AccountPage() {
    const {data: user, isLoading, isError, error} = useQuery<CurrentUser | null>({
        queryKey: ['current-user'],
        queryFn: getCurrentUser,
        retry: false,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    })

    return (
        <AppShell maxWidth={false}>
            <Menu/>
            <ContentArea>
                <Panel title="Account" sx={{height: '100%'}}>
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                        {isLoading && (
                            <Box sx={{display: 'grid', placeItems: 'center'}}>
                                <CircularProgress/>
                            </Box>
                        )}

                        {isError && (
                            <Typography color="error">{(error as Error)?.message ?? 'Failed to load user'}</Typography>
                        )}

                        {!isLoading && !isError && (
                            <> 
                                {!user ? (
                                    <Box sx={{textAlign: 'center'}}>
                                        <Typography variant="h6">Not signed in</Typography>
                                        <Button component={RouterLink} to="/login" variant="contained" sx={{mt: 2}}>Sign in</Button>
                                    </Box>
                                ) : (
                                    <Box>
                                        <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                                            <Avatar sx={{width: 64, height: 64}}>{(user.first_name || user.last_name) ? `${(user.first_name || '').charAt(0)}${(user.last_name || '').charAt(0)}`.toUpperCase() : (user.username || '').slice(0,2).toUpperCase()}</Avatar>

                                            <Box>
                                                <Typography variant="h5">{`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username}</Typography>
                                                <Typography variant="body2" color="text.secondary">@{user.username}</Typography>
                                            </Box>

                                        </Box>

                                        <Box sx={{mt: 2, display: 'grid', gap: 2, gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}}}>
                                            <Box>
                                                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                                                <Typography>{user.email || '—'}</Typography>
                                            </Box>

                                            <Box sx={{gridColumn: '1 / -1'}}>
                                                <Typography variant="subtitle2" color="text.secondary">Roles</Typography>
                                                <Box sx={{mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap'}}>
                                                    {(user.roles || []).map((r) => {
                                                        if (typeof r === 'string') {
                                                            return <Chip key={r} label={r} size="small" />
                                                        }

                                                        // use human-readable label if available
                                                        const label = (r as { label?: string; role: string }).label ?? r.role
                                                        if (r.scope === 'global') {
                                                            return <Chip key={`global-${r.role}`} label={label} size="small" />
                                                        }

                                                        // event or service
                                                        const roleWithTarget = r as { role: string; scope: string; target?: { name?: string } }
                                                        const targetName = roleWithTarget.target?.name
                                                        const display = targetName ? `${label} — ${targetName}` : label
                                                        return <Chip key={`${r.scope}-${r.role}-${targetName ?? ''}`} label={display} size="small" />
                                                    })}
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>
                                )}
                            </>
                        )}
                    </Box>
                </Panel>
            </ContentArea>
        </AppShell>
    )
}