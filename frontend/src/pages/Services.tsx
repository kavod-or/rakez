import {useEffect, useState} from 'react'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import {
    Box,
    Button,
    Fab,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Stack,
    TextField,
    Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined'
import EditIcon from '@mui/icons-material/Edit'

import {AppShell} from '../components/layout/AppShell'
import {Menu} from '../components/layout/Menu'
import {Panel} from '../components/layout/Panel'
import {ContentArea} from '../components/layout/ContentArea'
import {DetailDialog} from '../components/ui/DetailDialog'
import {
    createPosition,
    createService,
    deletePosition,
    deleteService,
    getPositions,
    getServices,
    patchPosition,
    patchService,
} from '../api/client'
import type {PositionItem, ServiceItem} from '../api/client'

const dialogIconButtonSx = {
    width: 28,
    height: 28,
    borderRadius: 1,
    '&:hover': {backgroundColor: 'action.hover'},
}

function getServicePositions(serviceId: number, positions: PositionItem[]) {
    return positions.filter((position) => position.service === serviceId)
}

function getPositionLabel(position: PositionItem, serviceNames: Map<number, string>) {
    return `${serviceNames.get(position.service ?? -1) ?? 'Unknown'} - ${position.name}`
}

export function ServicesPage() {
    const queryClient = useQueryClient()

    const {data: services = [], isLoading, isError, error} = useQuery<ServiceItem[]>({
        queryKey: ['services'],
        queryFn: getServices,
        retry: false,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    })

    const {data: positions = []} = useQuery<PositionItem[]>({
        queryKey: ['positions'],
        queryFn: getPositions,
        retry: false,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    })

    const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [createServiceName, setCreateServiceName] = useState('')
    const [createServiceError, setCreateServiceError] = useState<string | null>(null)
    const [serviceDialogOpen, setServiceDialogOpen] = useState(false)
    const [detailService, setDetailService] = useState<ServiceItem | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [serviceEditName, setServiceEditName] = useState('')
    const [serviceEditError, setServiceEditError] = useState<string | null>(null)
    const [isSavingService, setIsSavingService] = useState(false)
    const [isDeletingService, setIsDeletingService] = useState(false)
    const [deleteServiceDialogOpen, setDeleteServiceDialogOpen] = useState(false)
    const [positionInputOpen, setPositionInputOpen] = useState(false)
    const [positionSearch, setPositionSearch] = useState('')
    const [newPositionName, setNewPositionName] = useState('')
    const [isCreatingService, setIsCreatingService] = useState(false)
    const [isAddingPosition, setIsAddingPosition] = useState(false)
    const [positionError, setPositionError] = useState<string | null>(null)
    const [positionDrafts, setPositionDrafts] = useState<Record<number, string>>({})
    const [savingPositionId, setSavingPositionId] = useState<number | null>(null)
    const [deletingPositionId, setDeletingPositionId] = useState<number | null>(null)
    const serviceNames = new Map(services.map((service) => [service.id, service.name]))

    useEffect(() => {
        if (!detailService) {
            return
        }

        const servicePositions = getServicePositions(detailService.id, positions)

        setServiceEditName(detailService.name)
        setServiceEditError(null)
        setPositionDrafts(
            Object.fromEntries(servicePositions.map((position) => [position.id, position.name])),
        )
    }, [detailService, positions])

    const detailServicePositions = detailService ? getServicePositions(detailService.id, positions) : []
    const filteredServicePositions = detailServicePositions.filter((position) =>
        position.name.toLowerCase().includes(positionSearch.trim().toLowerCase()),
    )
    const hasPositionChanges = (position: PositionItem) =>
        (positionDrafts[position.id] ?? position.name).trim() !== position.name.trim()
    const hasServiceNameChanges = detailService ? serviceEditName.trim() !== detailService.name.trim() : false

    const closeServiceDialog = () => {
        setServiceDialogOpen(false)
        setIsEditing(false)
        setPositionInputOpen(false)
        setPositionSearch('')
        setServiceEditError(null)
        setPositionError(null)
    }

    const openServiceDetail = (service: ServiceItem) => {
        setSelectedServiceId(service.id)
        setDetailService(service)
        setIsEditing(false)
        setPositionInputOpen(false)
        setPositionSearch('')
        setServiceDialogOpen(true)
    }

    const handleCreateService = async () => {
        const trimmedName = createServiceName.trim()
        if (!trimmedName) {
            setCreateServiceError('Please enter a service name.')
            return
        }

        setIsCreatingService(true)
        setCreateServiceError(null)

        try {
            const created = await createService(trimmedName)
            queryClient.setQueryData(['services'], (old: ServiceItem[] | undefined) => [...(old ?? []), created])
            setSelectedServiceId(created.id)
            setCreateDialogOpen(false)
            setCreateServiceName('')
        } catch (error) {
            setCreateServiceError(error instanceof Error ? error.message : 'Failed to create service')
        } finally {
            setIsCreatingService(false)
        }
    }

    const handleSaveService = async () => {
        if (!detailService) return

        const trimmedName = serviceEditName.trim()
        if (!trimmedName) {
            setServiceEditError('Please enter a service name.')
            return
        }

        setIsSavingService(true)
        setServiceEditError(null)

        try {
            const updated = await patchService(detailService.id, trimmedName)
            queryClient.setQueryData(['services'], (old: ServiceItem[] | undefined) =>
                (old ?? []).map((service) => (service.id === detailService.id ? updated : service)),
            )
            setDetailService(updated)
            setServiceEditName(updated.name)
            setSelectedServiceId(updated.id)
        } catch (error) {
            setServiceEditError(error instanceof Error ? error.message : 'Failed to rename service')
        } finally {
            setIsSavingService(false)
        }
    }

    const handleDeleteService = async () => {
        if (!detailService) return

        setIsDeletingService(true)
        setServiceEditError(null)

        try {
            await deleteService(detailService.id)
            queryClient.setQueryData(['services'], (old: ServiceItem[] | undefined) =>
                (old ?? []).filter((service) => service.id !== detailService.id),
            )
            queryClient.setQueryData(['positions'], (old: PositionItem[] | undefined) =>
                (old ?? []).filter((position) => position.service !== detailService.id),
            )
            setDeleteServiceDialogOpen(false)
            setServiceDialogOpen(false)
            setDetailService(null)
            setSelectedServiceId(null)
        } catch (error) {
            setServiceEditError(error instanceof Error ? error.message : 'Failed to delete service')
        } finally {
            setIsDeletingService(false)
        }
    }

    const handleAddPosition = async () => {
        if (!detailService) return

        const trimmedName = newPositionName.trim()
        if (!trimmedName) {
            setPositionError('Please enter a position name.')
            return
        }

        setIsAddingPosition(true)
        setPositionError(null)

        try {
            const created = await createPosition(detailService.id, trimmedName)
            queryClient.setQueryData(['positions'], (old: PositionItem[] | undefined) => [...(old ?? []), created])
            setNewPositionName('')
            setPositionInputOpen(false)
        } catch (error) {
            setPositionError(error instanceof Error ? error.message : 'Failed to create position')
        } finally {
            setIsAddingPosition(false)
        }
    }

    const handleRenamePosition = async (position: PositionItem) => {
        const draftName = (positionDrafts[position.id] ?? position.name).trim()
        if (!draftName) {
            setPositionError('Please enter a position name.')
            return
        }

        setSavingPositionId(position.id)
        setPositionError(null)

        try {
            const updated = await patchPosition(position.id, draftName)
            queryClient.setQueryData(['positions'], (old: PositionItem[] | undefined) =>
                (old ?? []).map((item) => (item.id === position.id ? updated : item)),
            )
            setPositionDrafts((current) => ({
                ...current,
                [position.id]: updated.name,
            }))
        } catch (error) {
            setPositionError(error instanceof Error ? error.message : 'Failed to rename position')
        } finally {
            setSavingPositionId(null)
        }
    }

    const handleDeletePosition = async (position: PositionItem) => {
        setDeletingPositionId(position.id)
        setPositionError(null)

        try {
            await deletePosition(position.id)
            queryClient.setQueryData(['positions'], (old: PositionItem[] | undefined) =>
                (old ?? []).filter((item) => item.id !== position.id),
            )
            setPositionDrafts((current) => {
                const next = {...current}
                delete next[position.id]
                return next
            })
        } catch (error) {
            setPositionError(error instanceof Error ? error.message : 'Failed to delete position')
        } finally {
            setDeletingPositionId(null)
        }
    }

    return (
        <AppShell maxWidth={false}>
            <Menu/>
            <ContentArea>
                <Panel title="Services" sx={{height: '100%', position: 'relative'}}>
                    {isLoading && (
                        <Typography color="text.secondary">Loading services…</Typography>
                    )}

                    {isError && (
                        <Typography color="error">{(error as Error)?.message ?? 'Failed to load services'}</Typography>
                    )}

                    {!isLoading && !isError && (
                        <List sx={{width: '100%'}}>
                                {services.length === 0 ? (
                                    <ListItem disablePadding>
                                        <ListItemText primary="No services yet" secondary="Create one with the plus button below."/>
                                    </ListItem>
                                ) : (
                                    services.map((service) => (
                                        <ListItem key={service.id} disablePadding>
                                            <ListItemButton
                                                selected={serviceDialogOpen && selectedServiceId === service.id}
                                                onClick={() => openServiceDetail(service)}
                                                sx={{borderRadius: 2, py: 1.5}}
                                            >
                                                <ListItemText
                                                    primary={service.name}
                                                    secondary={`${getServicePositions(service.id, positions).length} positions`}
                                                />
                                            </ListItemButton>
                                        </ListItem>
                                    ))
                                )}
                        </List>
                    )}

                    <Fab
                        color="primary"
                        aria-label="Add service"
                        sx={{position: 'absolute', right: 24, bottom: 24}}
                        onClick={() => setCreateDialogOpen(true)}
                    >
                        <AddIcon/>
                    </Fab>
                </Panel>
            </ContentArea>

            <DetailDialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                maxWidth="xs"
                title="Create service"
                footer={
                    <>
                        <Button onClick={() => setCreateDialogOpen(false)} color="inherit">Cancel</Button>
                        <Button onClick={() => void handleCreateService()} variant="contained" disabled={isCreatingService || !createServiceName.trim()}>
                            {isCreatingService ? 'Creating…' : 'Create'}
                        </Button>
                    </>
                }
            >
                <Stack spacing={2} sx={{pt: 1}}>
                    <TextField
                        label="Service name"
                        value={createServiceName}
                        onChange={(event) => setCreateServiceName(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault()
                                void handleCreateService()
                            }
                        }}
                        autoFocus
                        fullWidth
                    />
                    {createServiceError && (
                        <Typography color="error" variant="body2">{createServiceError}</Typography>
                    )}
                </Stack>
            </DetailDialog>

            <DetailDialog
                open={serviceDialogOpen}
                onClose={closeServiceDialog}
                maxWidth="sm"
                title={
                    isEditing ? (
                        <Stack direction="row" spacing={1} sx={{alignItems: 'center', width: '100%'}}>
                            <TextField
                                fullWidth
                                size="small"
                                value={serviceEditName}
                                onChange={(event) => setServiceEditName(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault()
                                        if (hasServiceNameChanges) {
                                            void handleSaveService()
                                        } else {
                                            setIsEditing(false)
                                            setServiceEditError(null)
                                        }
                                    }
                                }}
                                sx={{'& .MuiInputBase-root': {fontSize: '1.25rem', fontWeight: 500}}}
                            />
                            {hasServiceNameChanges && (
                                <IconButton
                                    color="primary"
                                    size="small"
                                    aria-label="Save service name"
                                    onClick={() => void handleSaveService()}
                                    disabled={isSavingService || !serviceEditName.trim()}
                                >
                                    <CheckIcon fontSize="small"/>
                                </IconButton>
                            )}
                        </Stack>
                    ) : (
                        <span>{detailService?.name ?? 'Service details'}</span>
                    )
                }
                titleActions={
                    <Stack direction="row" spacing={0.5} sx={{alignItems: 'center'}}>
                        {!isEditing && (
                            <IconButton
                                aria-label="Edit service"
                                onClick={() => setIsEditing(true)}
                                size="small"
                                sx={{
                                    ...dialogIconButtonSx,
                                }}
                            >
                                <EditIcon fontSize="small"/>
                            </IconButton>
                        )}
                        <IconButton aria-label="Close service dialog" onClick={() => {
                            if (isEditing) {
                                setIsEditing(false)
                                setServiceEditError(null)
                                setPositionInputOpen(false)
                                return
                            }

                            closeServiceDialog()
                        }} size="small" sx={dialogIconButtonSx}>
                            <CloseIcon fontSize="small"/>
                        </IconButton>
                    </Stack>
                }
                contentSx={{position: 'relative', pb: 2}}
            >
                {detailService ? (
                    <Stack spacing={2}>
                        {serviceEditError && (
                            <Typography variant="body2" color="error">{serviceEditError}</Typography>
                        )}

                        <Box sx={{border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5, backgroundColor: 'rgba(0,0,0,0.01)'}}>
                            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1}}>
                                <Typography variant="subtitle2" sx={{fontWeight: 600, color: 'text.secondary'}}>Positions</Typography>
                                <Stack direction="row" spacing={1} sx={{alignItems: 'center', flex: 1, justifyContent: 'flex-end'}}>
                                    <TextField
                                        size="small"
                                        placeholder="Search"
                                        value={positionSearch}
                                        onChange={(event) => setPositionSearch(event.target.value)}
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
                                        size="small"
                                        color="primary"
                                        aria-label="Add position"
                                        onClick={() => setPositionInputOpen((value) => !value)}
                                    >
                                        <AddIcon/>
                                    </IconButton>
                                </Stack>
                            </Box>

                            {positionInputOpen && (
                                <Stack direction="row" spacing={1} sx={{mb: 2}}>
                                    <TextField
                                        size="small"
                                        placeholder="New position"
                                        value={newPositionName}
                                        onChange={(event) => setNewPositionName(event.target.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                event.preventDefault()
                                                void handleAddPosition()
                                            }
                                        }}
                                        autoFocus
                                        fullWidth
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={() => void handleAddPosition()}
                                        disabled={isAddingPosition || !newPositionName.trim()}
                                    >
                                        {isAddingPosition ? 'Adding…' : 'Add'}
                                    </Button>
                                </Stack>
                            )}

                            {positionError && (
                                <Typography variant="body2" color="error" sx={{mb: 1}}>{positionError}</Typography>
                            )}

                            <List
                                dense
                                disablePadding
                                sx={{
                                    height: 320,
                                    overflowY: 'auto',
                                    pr: 0.5,
                                }}
                            >
                                {filteredServicePositions.length === 0 ? (
                                    <ListItem disablePadding>
                                        <ListItemText primary={detailServicePositions.length === 0 ? 'No positions yet' : 'No matching positions'} secondary={detailServicePositions.length === 0 ? 'Use the plus button to add one.' : 'Try a different search.'}/>
                                    </ListItem>
                                ) : (
                                    filteredServicePositions.map((position) => (
                                        <ListItem key={position.id} disablePadding sx={{py: 0.5}}>
                                            {isEditing ? (
                                                <Stack direction="row" spacing={1} sx={{width: '100%', alignItems: 'center'}}>
                                                    <TextField
                                                        value={positionDrafts[position.id] ?? position.name}
                                                        onChange={(event) =>
                                                            setPositionDrafts((current) => ({
                                                                ...current,
                                                                [position.id]: event.target.value,
                                                            }))
                                                        }
                                                        onKeyDown={(event) => {
                                                            if (event.key === 'Enter' && hasPositionChanges(position)) {
                                                                event.preventDefault()
                                                                void handleRenamePosition(position)
                                                            }
                                                        }}
                                                        size="small"
                                                        fullWidth
                                                        sx={{'& .MuiInputBase-input': {fontSize: '0.875rem', lineHeight: 1.4}}}
                                                    />
                                                    {hasPositionChanges(position) && (
                                                        <IconButton
                                                            color="primary"
                                                            size="small"
                                                            aria-label={`Save position ${position.name}`}
                                                            onClick={() => void handleRenamePosition(position)}
                                                            disabled={savingPositionId === position.id || !((positionDrafts[position.id] ?? position.name).trim())}
                                                        >
                                                            <CheckIcon fontSize="small"/>
                                                        </IconButton>
                                                    )}
                                                    <IconButton
                                                        color="error"
                                                        size="small"
                                                        aria-label={`Delete position ${position.name}`}
                                                        onClick={() => void handleDeletePosition(position)}
                                                        disabled={deletingPositionId === position.id}
                                                    >
                                                        <DeleteOutlineOutlined fontSize="small"/>
                                                    </IconButton>
                                                </Stack>
                                            ) : (
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
                                                    <Typography variant="body2" sx={{fontSize: '0.875rem', lineHeight: 1.4}}>{getPositionLabel(position, serviceNames)}</Typography>
                                                </Box>
                                            )}
                                        </ListItem>
                                    ))
                                )}
                            </List>
                        </Box>

                        {isEditing && (
                            <Box sx={{display: 'flex', justifyContent: 'flex-start'}}>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    onClick={() => setDeleteServiceDialogOpen(true)}
                                    startIcon={<DeleteOutlineOutlined />}
                                    sx={{
                                        height: 36,
                                        minHeight: 36,
                                        paddingY: 0,
                                    }}
                                >
                                    Delete service
                                </Button>
                            </Box>
                        )}
                    </Stack>
                ) : null}
            </DetailDialog>
            <DetailDialog
                open={deleteServiceDialogOpen}
                onClose={() => setDeleteServiceDialogOpen(false)}
                maxWidth="xs"
                title="Delete service"
                footer={
                    <>
                        <Button onClick={() => setDeleteServiceDialogOpen(false)} color="inherit">Cancel</Button>
                        <Button onClick={() => void handleDeleteService()} color="error" variant="contained" disabled={isDeletingService}>
                            {isDeletingService ? 'Deleting…' : 'Delete'}
                        </Button>
                    </>
                }
            >
                <Typography variant="body1">
                    This will also delete all linked positions and will remove all the positions from staff.
                </Typography>
            </DetailDialog>
        </AppShell>
    )
}
