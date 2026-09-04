import {useEffect, useState} from 'react'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import {Avatar, Box, Button, Chip, CircularProgress, Fab, FormControl, IconButton, InputLabel, List, ListItem, ListItemButton, MenuItem, Select, Stack, TextField, Typography} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined'
import EditIcon from '@mui/icons-material/Edit'

import {addUserRole, createUser, getCurrentUser, getEvents, getServices, getUsers, patchUser, removeUserRole} from '../api/client'
import type {CurrentUser, EventItem, RoleScope, ServiceItem, UserInput, UserItem} from '../api/client'
import {AppShell} from '../components/layout/AppShell'
import {Menu} from '../components/layout/Menu'
import {Panel} from '../components/layout/Panel'
import {ContentArea} from '../components/layout/ContentArea'
import {DetailDialog} from '../components/ui/DetailDialog'

const dialogIconButtonSx = {
    width: 28,
    height: 28,
    borderRadius: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': {backgroundColor: 'action.hover'},
}

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

function UserRoleChips({roles}: {roles: UserItem['roles']}) {
    if (!roles.length) {
        return <Typography variant="body2" color="text.secondary">No roles</Typography>
    }

    return (
        <>
            {roles.map((role) => (
                <Chip key={`${role.scope}-${role.id}`} label={getRoleLabel(role)} size="small"/>
            ))}
        </>
    )
}

function UserRoleList({roles, onRemove, removingId}: {roles: UserItem['roles']; onRemove?: (role: UserItem['roles'][number]) => void; removingId?: number | null}) {
    return (
        <List dense disablePadding sx={{maxHeight: 280, overflowY: 'auto', pr: 0.5}}>
            {roles.map((role) => (
                <ListItem key={`${role.scope}-${role.id}`} disablePadding sx={{py: 0.5}}>
                    <Stack direction="row" spacing={1} sx={{width: '100%', alignItems: 'center'}}>
                        <Box
                            sx={{
                                width: '100%',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                px: 1.5,
                                py: 0.75,
                                backgroundColor: 'background.paper',
                                display: 'flex',
                                alignItems: 'center',
                                minHeight: 40,
                            }}
                        >
                            <Typography variant="body2" sx={{fontSize: '0.875rem', lineHeight: 1.4}}>
                                {getRoleLabel(role)}
                            </Typography>
                        </Box>
                        {onRemove && (
                            <IconButton
                                aria-label={`Remove role ${getRoleLabel(role)}`}
                                size="small"
                                color="error"
                                onClick={() => onRemove(role)}
                                disabled={removingId === role.id}
                                sx={{width: 28, height: 28, borderRadius: 1}}
                            >
                                <DeleteOutlineOutlined fontSize="small"/>
                            </IconButton>
                        )}
                    </Stack>
                </ListItem>
            ))}
        </List>
    )
}

function UserFields({value, onChange, includePassword, includeUsername = true}: {
    value: UserInput
    onChange: (value: UserInput) => void
    includePassword: boolean
    includeUsername?: boolean
}) {
    const update = (field: keyof UserInput, fieldValue: string) => onChange({...value, [field]: fieldValue})

    return (
        <Stack spacing={2}>
            {includeUsername && <TextField label="Username" value={value.username} onChange={(event) => update('username', event.target.value)} required fullWidth/>}
            <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
                <TextField label="First name" value={value.first_name} onChange={(event) => update('first_name', event.target.value)} fullWidth/>
                <TextField label="Last name" value={value.last_name} onChange={(event) => update('last_name', event.target.value)} fullWidth/>
            </Stack>
            <TextField label="Email" type="email" value={value.email} onChange={(event) => update('email', event.target.value)} fullWidth/>
            <TextField
                label={includePassword ? 'Password' : 'New password'}
                type="password"
                value={value.password ?? ''}
                onChange={(event) => update('password', event.target.value)}
                required={includePassword}
                placeholder={includePassword ? undefined : '••••••••'}
                helperText={includePassword ? undefined : 'Leave blank to keep the current password.'}
                fullWidth
            />
        </Stack>
    )
}

const ROLE_OPTIONS: Record<RoleScope, {value: string; label: string}[]> = {
    global: [
        {value: 'global_manager', label: 'Global Manager'},
        {value: 'viewer', label: 'Viewer'},
    ],
    event: [
        {value: 'event_manager', label: 'Event Manager'},
        {value: 'viewer', label: 'Viewer'},
    ],
    service: [
        {value: 'service_manager', label: 'Service Manager'},
        {value: 'viewer', label: 'Viewer'},
    ],
}

function AddRoleForm({open, onAdd, onCancel}: {open: boolean; onAdd: (input: {scope: RoleScope; role: string; target_id?: string}) => Promise<void>; onCancel: () => void}) {
    const {data: events = []} = useQuery<EventItem[]>({
        queryKey: ['events'],
        queryFn: getEvents,
        retry: false,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    })
    const {data: services = []} = useQuery<ServiceItem[]>({
        queryKey: ['services'],
        queryFn: getServices,
        retry: false,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    })

    const [scope, setScope] = useState<RoleScope>('global')
    const [role, setRole] = useState(ROLE_OPTIONS.global[0].value)
    const [targetId, setTargetId] = useState('')
    const [isAdding, setIsAdding] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const targets = scope === 'event' ? events.map((event) => ({id: event.public_id, name: event.name}))
        : scope === 'service' ? services.map((service) => ({id: String(service.id), name: service.name}))
        : []

    const handleScopeChange = (nextScope: RoleScope) => {
        setScope(nextScope)
        setRole(ROLE_OPTIONS[nextScope][0].value)
        setTargetId('')
        setError(null)
    }

    const handleAdd = async () => {
        if (scope !== 'global' && !targetId) {
            setError(scope === 'event' ? 'Please select an event.' : 'Please select a service.')
            return
        }

        setIsAdding(true)
        setError(null)
        try {
            await onAdd({scope, role, target_id: scope === 'global' ? undefined : targetId})
            setScope('global')
            setRole(ROLE_OPTIONS.global[0].value)
            setTargetId('')
        } catch (addError) {
            setError(addError instanceof Error ? addError.message : 'Failed to add role')
        } finally {
            setIsAdding(false)
        }
    }

    if (!open) {
        return null
    }

    return (
        <Stack spacing={1} sx={{mb: 2}}>
            <Stack direction="row" spacing={1} sx={{alignItems: 'center', flexWrap: 'wrap'}}>
                <FormControl size="small" sx={{minWidth: 170, flex: 1}}>
                    <InputLabel id="role-scope-label">Scope</InputLabel>
                    <Select labelId="role-scope-label" value={scope} label="Scope" onChange={(event) => handleScopeChange(event.target.value as RoleScope)}>
                        <MenuItem value="global">Global</MenuItem>
                        <MenuItem value="event">Event</MenuItem>
                        <MenuItem value="service">Service</MenuItem>
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{minWidth: 170, flex: 1}}>
                    <InputLabel id="role-role-label">Role</InputLabel>
                    <Select labelId="role-role-label" value={role} label="Role" onChange={(event) => setRole(event.target.value)}>
                        {ROLE_OPTIONS[scope].map((option) => (
                            <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                {scope !== 'global' && (
                    <FormControl size="small" sx={{minWidth: 170, flex: 1}}>
                        <InputLabel id="role-target-label">{scope === 'event' ? 'Event' : 'Service'}</InputLabel>
                        <Select labelId="role-target-label" value={targetId} label={scope === 'event' ? 'Event' : 'Service'} onChange={(event) => setTargetId(event.target.value)}>
                            {targets.map((target) => (
                                <MenuItem key={target.id} value={target.id}>{target.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
                <Button variant="contained" size="small" disabled={isAdding} onClick={() => void handleAdd()}>
                    Add
                </Button>
                <Button size="small" color="inherit" onClick={onCancel}>
                    Cancel
                </Button>
            </Stack>
            {error && <Typography color="error" variant="body2">{error}</Typography>}
        </Stack>
    )
}

function toUserInput(user?: UserItem): UserInput {
    return {
        username: user?.username ?? '',
        first_name: user?.first_name ?? '',
        last_name: user?.last_name ?? '',
        email: user?.email ?? '',
        password: '',
    }
}

function UserDetailDialog({user, canManage, onClose, onSave, onAddRole, onRemoveRole}: {
    user: UserItem | null
    canManage: boolean
    onClose: () => void
    onSave: (user: UserInput) => Promise<void>
    onAddRole: (role: {scope: RoleScope; role: string; target_id?: string}) => Promise<void>
    onRemoveRole: (role: UserItem['roles'][number]) => Promise<void>
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [draft, setDraft] = useState<UserInput>(toUserInput())
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [removingRoleId, setRemovingRoleId] = useState<number | null>(null)
    const [isAddingRole, setIsAddingRole] = useState(false)
    const [roleSearch, setRoleSearch] = useState('')

    useEffect(() => {
        setDraft(toUserInput(user ?? undefined))
        setError(null)
        setIsEditing(false)
        setIsAddingRole(false)
        setRoleSearch('')
    }, [user])

    const save = async () => {
        if (!draft.username.trim()) {
            setError('Please enter a username.')
            return
        }

        setIsSaving(true)
        setError(null)
        try {
            await onSave({...draft, username: draft.username.trim()})
            setIsEditing(false)
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Failed to update user')
        } finally {
            setIsSaving(false)
        }
    }

    const handleRemoveRole = async (role: UserItem['roles'][number]) => {
        setRemovingRoleId(role.id)
        try {
            await onRemoveRole(role)
        } finally {
            setRemovingRoleId(null)
        }
    }

    const filteredRoles = (user?.roles ?? []).filter((role) =>
        getRoleLabel(role).toLowerCase().includes(roleSearch.trim().toLowerCase()),
    )

    return (
        <DetailDialog
            open={Boolean(user)}
            onClose={onClose}
            maxWidth="sm"
            contentSx={{position: 'relative', pb: 2}}
            title={
                <Typography variant="h6" sx={{fontWeight: 600}}>
                    {user ? getDisplayName(user) : 'User details'}
                </Typography>
            }
            titleActions={
                <Stack direction="row" spacing={0.5} sx={{alignItems: 'center'}}>
                    {canManage && !isEditing && (
                        <IconButton
                            aria-label="Edit user"
                            onClick={() => setIsEditing(true)}
                            size="small"
                            sx={dialogIconButtonSx}
                        >
                            <EditIcon fontSize="small"/>
                        </IconButton>
                    )}
                    {canManage && isEditing && (
                        <IconButton
                            color="primary"
                            aria-label="Save user"
                            onClick={() => void save()}
                            disabled={isSaving}
                            size="small"
                            sx={dialogIconButtonSx}
                        >
                            <CheckIcon fontSize="small"/>
                        </IconButton>
                    )}
                    <IconButton
                        aria-label="Close user details"
                        onClick={() => {
                            if (isEditing) {
                                setIsEditing(false)
                                setDraft(toUserInput(user ?? undefined))
                                setError(null)
                                return
                            }

                            onClose()
                        }}
                        size="small"
                        sx={dialogIconButtonSx}
                    >
                        <CloseIcon fontSize="small"/>
                    </IconButton>
                </Stack>
            }
        >
            {user && (
                <Stack spacing={2}>
                    {isEditing ? (
                        <UserFields value={draft} onChange={setDraft} includePassword={false} includeUsername={false}/>
                    ) : (
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                            <Avatar sx={{width: 52, height: 52, backgroundColor: 'primary.main', color: 'primary.contrastText', fontWeight: 700}}>
                                {getInitials(user)}
                            </Avatar>
                            <Box sx={{minWidth: 0}}>
                                <Typography variant="body2" color="text.secondary">@{user.username}</Typography>
                                <Typography variant="body2" color="text.secondary">{user.email || 'No email address'}</Typography>
                            </Box>
                        </Box>
                    )}
                    {error && <Typography color="error" variant="body2">{error}</Typography>}
                    <Box sx={{border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5, backgroundColor: 'rgba(0,0,0,0.01)'}}>
                        <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1}}>
                            <Typography variant="subtitle2" sx={{fontWeight: 600, color: 'text.secondary'}}>Roles</Typography>
                            {!isAddingRole && canManage && (
                                <Stack direction="row" spacing={1} sx={{alignItems: 'center', flex: 1, justifyContent: 'flex-end'}}>
                                    <TextField
                                        size="small"
                                        placeholder="Search"
                                        value={roleSearch}
                                        onChange={(event) => setRoleSearch(event.target.value)}
                                        sx={{
                                            minWidth: 180,
                                            maxWidth: 220,
                                            '& .MuiInputBase-root': {
                                                backgroundColor: 'rgba(15, 23, 42, 0.45)',
                                                height: 32,
                                            },
                                        }}
                                    />
                                    <IconButton
                                        aria-label="Add role"
                                        size="small"
                                        onClick={() => setIsAddingRole(true)}
                                        sx={{width: 28, height: 28, borderRadius: 1}}
                                    >
                                        <AddIcon fontSize="small"/>
                                    </IconButton>
                                </Stack>
                            )}
                        </Box>

                        {canManage && (
                            <AddRoleForm
                                open={isAddingRole}
                                onAdd={async (role) => {
                                    setIsAddingRole(false)
                                    await onAddRole(role)
                                }}
                                onCancel={() => setIsAddingRole(false)}
                            />
                        )}

                        {filteredRoles.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                                {roleSearch.trim() ? 'No matching roles.' : 'No roles assigned.'}
                            </Typography>
                        ) : (
                            <UserRoleList roles={filteredRoles} onRemove={canManage ? (role) => void handleRemoveRole(role) : undefined} removingId={removingRoleId}/>
                        )}
                    </Box>
                </Stack>
            )}
        </DetailDialog>
    )
}

function UserCreateDialog({open, onClose, onCreate}: {
    open: boolean
    onClose: () => void
    onCreate: (user: UserInput & {password: string}) => Promise<void>
}) {
    const [draft, setDraft] = useState<UserInput>(toUserInput())
    const [error, setError] = useState<string | null>(null)
    const [isCreating, setIsCreating] = useState(false)

    const close = () => {
        setDraft(toUserInput())
        setError(null)
        onClose()
    }

    const create = async () => {
        if (!draft.username.trim() || !draft.password) {
            setError('Username and password are required.')
            return
        }

        setIsCreating(true)
        setError(null)
        try {
            await onCreate({...draft, username: draft.username.trim(), password: draft.password})
            close()
        } catch (createError) {
            setError(createError instanceof Error ? createError.message : 'Failed to create user')
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <DetailDialog
            open={open}
            onClose={close}
            maxWidth="sm"
            title="Create user"
            footer={
                <>
                    <Button color="inherit" onClick={close}>Cancel</Button>
                    <Button variant="contained" onClick={() => void create()} disabled={isCreating}>{isCreating ? 'Creating…' : 'Create'}</Button>
                </>
            }
        >
            <Stack spacing={2}>
                <UserFields value={draft} onChange={setDraft} includePassword/>
                {error && <Typography color="error" variant="body2">{error}</Typography>}
            </Stack>
        </DetailDialog>
    )
}

function isGlobalManager(user: CurrentUser | null | undefined) {
    return user?.roles.some((role) => role.scope === 'global' && role.role === 'global_manager') ?? false
}

export function UsersPage() {
    const queryClient = useQueryClient()
    const {data: users = [], isLoading, isError, error} = useQuery<UserItem[]>({
        queryKey: ['users'],
        queryFn: getUsers,
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
    const [search, setSearch] = useState('')
    const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const canManage = isGlobalManager(currentUser)
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
                                    {filteredUsers.map((user) => (
                                        <ListItem key={user.id} disablePadding>
                                            <ListItemButton onClick={() => setSelectedUser(user)} sx={userRowSx}>
                                                <Avatar sx={{width: 44, height: 44, flexShrink: 0, backgroundColor: 'primary.main', color: 'primary.contrastText', fontWeight: 700}}>{getInitials(user)}</Avatar>
                                                <Box sx={{minWidth: 140, width: '35%', maxWidth: 320, flex: '0 1 35%', overflowX: 'hidden', overflowY: 'hidden'}}>
                                                    <Typography sx={{fontWeight: 600}} noWrap>{getDisplayName(user)}</Typography>
                                                    <Typography variant="body2" color="text.secondary" noWrap>@{user.username}</Typography>
                                                </Box>
                                                <Box sx={roleListSx}><UserRoleChips roles={user.roles}/></Box>
                                            </ListItemButton>
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Box>
                    )}
                    {canManage && (
                        <Fab color="primary" aria-label="Add user" sx={{position: 'absolute', right: 24, bottom: 24}} onClick={() => setCreateDialogOpen(true)}>
                            <AddIcon/>
                        </Fab>
                    )}
                </Panel>
            </ContentArea>
            <UserDetailDialog
                key={selectedUser?.id ?? 'no-user-selected'}
                user={selectedUser}
                canManage={canManage}
                onClose={() => setSelectedUser(null)}
                onSave={async (user) => {
                    if (!selectedUser) return
                    const updated = await patchUser(selectedUser.id, {
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        password: user.password,
                    })
                    queryClient.setQueryData(['users'], (old: UserItem[] | undefined) =>
                        (old ?? []).map((item) => item.id === updated.id ? updated : item),
                    )
                    setSelectedUser(updated)
                }}
                onAddRole={async (role) => {
                    if (!selectedUser) return
                    const updated = await addUserRole(selectedUser.id, role)
                    queryClient.setQueryData(['users'], (old: UserItem[] | undefined) =>
                        (old ?? []).map((item) => item.id === updated.id ? updated : item),
                    )
                    setSelectedUser(updated)
                }}
                onRemoveRole={async (role) => {
                    if (!selectedUser) return
                    const updated = await removeUserRole(selectedUser.id, role.scope, role.id)
                    queryClient.setQueryData(['users'], (old: UserItem[] | undefined) =>
                        (old ?? []).map((item) => item.id === updated.id ? updated : item),
                    )
                    setSelectedUser(updated)
                }}
            />
            <UserCreateDialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                onCreate={async (user) => {
                    const created = await createUser(user)
                    queryClient.setQueryData(['users'], (old: UserItem[] | undefined) => [...(old ?? []), created])
                }}
            />
        </AppShell>
    )
}
