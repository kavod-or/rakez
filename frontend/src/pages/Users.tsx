import {useState} from 'react'
import {useQuery} from '@tanstack/react-query'
import {Avatar, Box, Chip, CircularProgress, IconButton, List, ListItem, ListItemButton, Stack, TextField, Typography} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

import {getUsers} from '../api/client'
import type {UserItem} from '../api/client'
import {AppShell} from '../components/layout/AppShell'
import {Menu} from '../components/layout/Menu'
import {Panel} from '../components/layout/Panel'
import {ContentArea} from '../components/layout/ContentArea'
import {DetailDialog} from '../components/ui/DetailDialog'

const userRowSx = {
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 2,
    px: {xs: 1.5, sm: 2},
    py: 1.5,
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 2,
    overflow: 'hidden',
    '&:hover': {
        borderColor: 'primary.main',
        backgroundColor: 'rgba(148, 163, 184, 0.06)',
    },
}

const roleListSx = {
    display: 'flex',
    gap: 0.75,
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    flex: '1 1 auto',
    minWidth: 0,
    overflowX: 'auto',
    overflowY: 'hidden',
    '& .MuiChip-root': {flexShrink: 0},
}

function getDisplayName(user: UserItem) {
    return `${user.first_name} ${user.last_name}`.trim() || user.username
}

function getInitials(user: UserItem) {
    return `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase() || user.username.slice(0, 2).toUpperCase()
}

function getRoleLabel(role: UserItem['roles'][number]) {
    const targetName = role.scope === 'event' || role.scope === 'service' ? role.target.name : null
    return targetName ? `${role.label} — ${targetName}` : role.label
}

function UserRoleList({user}: {user: UserItem}) {
    if (!user.roles.length) {
        return <Typography variant="body2" color="text.secondary">No roles</Typography>
    }

    return (
        <>
            {user.roles.map((role, index) => (
                <Chip key={`${role.scope}-${role.role}-${index}`} label={getRoleLabel(role)} size="small"/>
            ))}
        </>
    )
}

function UserDetailDialog({user, onClose}: {user: UserItem | null; onClose: () => void}) {
    return (
        <DetailDialog
            open={Boolean(user)}
            onClose={onClose}
            maxWidth="sm"
            title={user ? getDisplayName(user) : 'User details'}
            titleActions={
                <IconButton aria-label="Close user details" onClick={onClose} size="small">
                    <CloseIcon fontSize="small"/>
                </IconButton>
            }
        >
            {user && (
                <Stack spacing={2}>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                        <Avatar sx={{width: 52, height: 52, backgroundColor: 'primary.main', color: 'primary.contrastText', fontWeight: 700}}>
                            {getInitials(user)}
                        </Avatar>
                        <Box sx={{minWidth: 0}}>
                            <Typography variant="body2" color="text.secondary">@{user.username}</Typography>
                            <Typography variant="body2" color="text.secondary">{user.email || 'No email address'}</Typography>
                        </Box>
                    </Box>
                    <Box sx={{border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5}}>
                        <Typography variant="subtitle2" sx={{fontWeight: 600, color: 'text.secondary', mb: 1}}>Roles</Typography>
                        <Box sx={{display: 'flex', gap: 0.75, flexWrap: 'wrap'}}>
                            {user.roles.length ? <UserRoleList user={user}/> : <Typography variant="body2" color="text.secondary">No roles assigned</Typography>}
                        </Box>
                    </Box>
                </Stack>
            )}
        </DetailDialog>
    )
}

export function UsersPage() {
    const {data: users = [], isLoading, isError, error} = useQuery<UserItem[]>({
        queryKey: ['users'],
        queryFn: getUsers,
        retry: false,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    })
    const [search, setSearch] = useState('')
    const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
    const filteredUsers = users.filter((user) => {
        const query = search.trim().toLowerCase()
        return !query || `${user.first_name} ${user.last_name} ${user.username}`.toLowerCase().includes(query)
    })

    return (
        <AppShell maxWidth={false}>
            <Menu/>
            <ContentArea>
                <Panel title="Users" sx={{height: '100%', position: 'relative'}}>
                    <Stack direction={{xs: 'column', sm: 'row'}} spacing={1.5} sx={{justifyContent: 'space-between', alignItems: {xs: 'stretch', sm: 'center'}, mb: 1.5}}>
                        <TextField
                            size="small"
                            placeholder="Search users"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            sx={{maxWidth: {sm: 320}, '& .MuiInputBase-root': {backgroundColor: 'rgba(15, 23, 42, 0.45)'}}}
                            slotProps={{htmlInput: {'aria-label': 'Search users by name or username'}}}
                        />
                    </Stack>

                    {isLoading && <Box sx={{display: 'grid', placeItems: 'center', minHeight: 200}}><CircularProgress/></Box>}
                    {isError && <Typography color="error">{(error as Error)?.message ?? 'Failed to load users'}</Typography>}
                    {!isLoading && !isError && (
                        <Box sx={{minHeight: 0, overflowY: 'auto', pr: 0.5}}>
                            {filteredUsers.length === 0 ? (
                                <Typography color="text.secondary" sx={{p: 2}}>
                                    {search.trim() ? 'No users match your search.' : 'No users found.'}
                                </Typography>
                            ) : (
                                <List disablePadding sx={{display: 'grid', gap: 1}}>
                                    {filteredUsers.map((user) => {
                                        const displayName = getDisplayName(user)
                                        const initials = getInitials(user)
                                        return (
                                            <ListItem key={user.id} disablePadding>
                                                <ListItemButton onClick={() => setSelectedUser(user)} sx={userRowSx}>
                                                    <Avatar sx={{width: 44, height: 44, flexShrink: 0, backgroundColor: 'primary.main', color: 'primary.contrastText', fontWeight: 700}}>{initials}</Avatar>
                                                    <Box sx={{minWidth: 140, width: '35%', maxWidth: 320, flex: '0 1 35%', overflowX: 'hidden', overflowY: 'hidden'}}>
                                                        <Typography sx={{fontWeight: 600}} noWrap>{displayName}</Typography>
                                                        <Typography variant="body2" color="text.secondary" noWrap>@{user.username}</Typography>
                                                    </Box>
                                                    <Box sx={roleListSx}><UserRoleList user={user}/></Box>
                                                </ListItemButton>
                                            </ListItem>
                                        )
                                    })}
                                </List>
                            )}
                        </Box>
                    )}
                </Panel>
            </ContentArea>
            <UserDetailDialog user={selectedUser} onClose={() => setSelectedUser(null)}/>
        </AppShell>
    )
}
