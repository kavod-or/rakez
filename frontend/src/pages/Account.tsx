import {useState, useEffect} from 'react'
import {Box, CircularProgress, Typography, Avatar, Chip, Button, TextField, Stack, Alert, Snackbar} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import {Link as RouterLink, useNavigate} from 'react-router-dom'

import {AppShell} from '../components/layout/AppShell'
import {Menu} from '../components/layout/Menu'
import {Panel} from '../components/layout/Panel'
import {ContentArea} from '../components/layout/ContentArea'
import {getCurrentUser, updateCurrentUser} from '../api/client'
import type {CurrentUser} from '../api/client'

export function AccountPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const {data: user, isLoading, isError, error} = useQuery<CurrentUser | null>({
        queryKey: ['current-user'],
        queryFn: getCurrentUser,
        retry: false,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    })

    const [isEditing, setIsEditing] = useState(false)
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [saveError, setSaveError] = useState<string | null>(null)

    const resetForm = () => {
        if (user) {
            setFirstName(user.first_name || '')
            setLastName(user.last_name || '')
            setEmail(user.email || '')
            setPassword('')
        }
    }

    useEffect(() => {
        resetForm()
        setIsEditing(false)
    }, [user])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setSuccessMessage(null)
        setSaveError(null)

        const passwordChanged = Boolean(password.trim())

        try {
            const updatedUser = await updateCurrentUser({
                first_name: firstName,
                last_name: lastName,
                email: email,
                password: passwordChanged ? password : undefined,
            })

            if (passwordChanged) {
                queryClient.setQueryData(['current-user'], null)
                navigate('/login', {
                    replace: true,
                    state: {message: 'Password updated successfully. Please sign in with your new password.'},
                })
            } else {
                queryClient.setQueryData(['current-user'], updatedUser)
                setPassword('')
                setIsEditing(false)
                setSuccessMessage('Account details updated successfully.')
            }
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Failed to update account details.')
        } finally {
            setIsSaving(false)
        }
    }

    const renderRoles = () => {
        const rolesList = user?.roles || []
        if (rolesList.length === 0) {
            return <Typography variant="body2" color="text.secondary">No roles assigned</Typography>
        }

        return rolesList.map((r) => {
            if (typeof r === 'string') {
                return <Chip key={r} label={r} size="small" />
            }

            const label = (r as { label?: string; role: string }).label ?? r.role
            if (r.scope === 'global') {
                return <Chip key={`global-${r.role}`} label={label} size="small" />
            }

            const roleWithTarget = r as { role: string; scope: string; target?: { name?: string } }
            const targetName = roleWithTarget.target?.name
            const display = targetName ? `${label} — ${targetName}` : label
            return <Chip key={`${r.scope}-${r.role}-${targetName ?? ''}`} label={display} size="small" />
        })
    }

    return (
        <AppShell maxWidth={false}>
            <Menu/>
            <ContentArea>
                <Panel title="Account" sx={{height: '100%'}}>
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 600}}>
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
                                    <Stack spacing={3}>
                                        <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2}}>
                                            <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                                                <Avatar sx={{width: 64, height: 64, backgroundColor: 'primary.main', color: 'primary.contrastText', fontWeight: 700}}>
                                                    {(user.first_name || user.last_name) ? `${(user.first_name || '').charAt(0)}${(user.last_name || '').charAt(0)}`.toUpperCase() : (user.username || '').slice(0, 2).toUpperCase()}
                                                </Avatar>

                                                <Box>
                                                    <Typography variant="h5">{`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username}</Typography>
                                                    <Typography variant="body2" color="text.secondary">@{user.username}</Typography>
                                                </Box>
                                            </Box>

                                            {!isEditing ? (
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<EditIcon />}
                                                    onClick={() => setIsEditing(true)}
                                                    size="small"
                                                >
                                                    Edit Profile
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="text"
                                                    color="inherit"
                                                    onClick={() => {
                                                        setIsEditing(false)
                                                        resetForm()
                                                        setSaveError(null)
                                                    }}
                                                    size="small"
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                        </Box>

                                        {saveError && (
                                            <Alert severity="error" onClose={() => setSaveError(null)}>
                                                {saveError}
                                            </Alert>
                                        )}

                                        {!isEditing ? (
                                            <Box sx={{display: 'grid', gap: 2.5, gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}}}>
                                                <Box>
                                                    <Typography variant="subtitle2" color="text.secondary">Username</Typography>
                                                    <Typography sx={{fontWeight: 500}}>@{user.username}</Typography>
                                                </Box>

                                                <Box>
                                                    <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                                                    <Typography sx={{fontWeight: 500}}>{`${user.first_name || ''} ${user.last_name || ''}`.trim() || '—'}</Typography>
                                                </Box>

                                                <Box>
                                                    <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                                                    <Typography sx={{fontWeight: 500}}>{user.email || '—'}</Typography>
                                                </Box>

                                                <Box>
                                                    <Typography variant="subtitle2" color="text.secondary">Password</Typography>
                                                    <Typography color="text.secondary">••••••••</Typography>
                                                </Box>

                                                <Box sx={{gridColumn: '1 / -1'}}>
                                                    <Typography variant="subtitle2" color="text.secondary" sx={{mb: 1}}>
                                                        Roles
                                                    </Typography>
                                                    <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap'}}>
                                                        {renderRoles()}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        ) : (
                                            <Stack spacing={3} component="form" onSubmit={handleSave}>
                                                <Stack spacing={2}>
                                                    <TextField
                                                        label="Username"
                                                        value={user.username}
                                                        disabled
                                                        helperText="Username cannot be changed."
                                                        fullWidth
                                                    />

                                                    <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
                                                        <TextField
                                                            label="First name"
                                                            value={firstName}
                                                            onChange={(e) => setFirstName(e.target.value)}
                                                            fullWidth
                                                        />
                                                        <TextField
                                                            label="Last name"
                                                            value={lastName}
                                                            onChange={(e) => setLastName(e.target.value)}
                                                            fullWidth
                                                        />
                                                    </Stack>

                                                    <TextField
                                                        label="Email"
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        fullWidth
                                                    />

                                                    <TextField
                                                        label="New password"
                                                        type="password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        placeholder="••••••••"
                                                        helperText="Leave blank to keep current password."
                                                        fullWidth
                                                    />
                                                </Stack>

                                                <Box sx={{border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5, backgroundColor: 'rgba(0,0,0,0.01)'}}>
                                                    <Typography variant="subtitle2" sx={{fontWeight: 600, color: 'text.secondary', mb: 1}}>
                                                        Roles
                                                    </Typography>
                                                    <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap'}}>
                                                        {renderRoles()}
                                                    </Box>
                                                </Box>

                                                <Stack direction="row" spacing={1.5}>
                                                    <Button type="submit" variant="contained" disabled={isSaving}>
                                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outlined"
                                                        color="inherit"
                                                        onClick={() => {
                                                            setIsEditing(false)
                                                            resetForm()
                                                            setSaveError(null)
                                                        }}
                                                        disabled={isSaving}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </Stack>
                                            </Stack>
                                        )}
                                    </Stack>
                                )}
                            </>
                        )}
                    </Box>

                    <Snackbar
                        open={Boolean(successMessage)}
                        autoHideDuration={4000}
                        onClose={() => setSuccessMessage(null)}
                        anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
                    >
                        <Alert severity="success" variant="filled" onClose={() => setSuccessMessage(null)}>
                            {successMessage}
                        </Alert>
                    </Snackbar>
                </Panel>
            </ContentArea>
        </AppShell>
    )
}