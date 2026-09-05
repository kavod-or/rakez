import {useEffect, useState} from 'react'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Fab,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined'
import EditIcon from '@mui/icons-material/Edit'
import {DataGrid, GridToolbarFilterButton, QuickFilter, type GridColDef} from '@mui/x-data-grid'

import {AppShell} from '../components/layout/AppShell'
import {Menu} from '../components/layout/Menu'
import {Panel} from '../components/layout/Panel'
import {ContentArea} from '../components/layout/ContentArea'
import {DetailDialog} from '../components/ui/DetailDialog'
import {assignStaffPosition, createStaff, deleteStaff, getPositions, getServices, getStaff, patchStaff, removeStaffPosition} from '../api/client'
import type {PositionItem, ServiceItem, StaffItem, StaffPosition} from '../api/client'

type StaffRow = {
    id: number
    firstname: string
    lastname: string
    services: string
    member: StaffItem
}

export const emptyStaff: StaffItem = {
    id: 0,
    public_id: '',
    firstname: '',
    lastname: '',
    positions: [],
}

function getStaffRows(staff: StaffItem[], services: ServiceItem[]): StaffRow[] {
    const serviceNames = new Map(services.map((service) => [service.id, service.name]))

    return staff.map((member) => ({
        id: member.id,
        firstname: member.firstname,
        lastname: member.lastname,
        services: Array.from(new Set(
            member.positions
                .map((position) => serviceNames.get(position.service ?? -1))
                .filter((name): name is string => Boolean(name)),
        )).join(', ') || '—',
        member,
    }))
}

const staffColumns: GridColDef<StaffRow>[] = [
    {field: 'firstname', headerName: 'First name', flex: 1, minWidth: 160},
    {field: 'lastname', headerName: 'Last name', flex: 1, minWidth: 160},
    {
        field: 'services',
        headerName: 'Services',
        flex: 2,
        minWidth: 220,
        getApplyQuickFilterFn: () => null,
    },
]

function StaffToolbar() {
    return (
        <Stack direction="row" spacing={1} sx={{alignItems: 'center', p: 1}}>
            <QuickFilter/>
            <GridToolbarFilterButton/>
        </Stack>
    )
}

const dialogIconButtonSx = {
    width: 28,
    height: 28,
    borderRadius: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': {backgroundColor: 'action.hover'},
}

export function StaffDetailDialog({
    staff,
    services,
    positions,
    onClose,
    onAddPosition,
    onRemovePosition,
    onUpdateStaffName,
    onCreateStaff,
    onDeleteStaff,
    isCreateMode = false,
    open,
    error,
}: {
    staff: StaffItem | null
    services: ServiceItem[]
    positions: PositionItem[]
    onClose: () => void
    onAddPosition: (positionId: number) => Promise<void>
    onRemovePosition: (positionId: number) => Promise<void>
    onUpdateStaffName: (firstname: string, lastname: string) => Promise<void>
    onCreateStaff?: (firstname: string, lastname: string) => Promise<void>
    onDeleteStaff?: () => void
    isCreateMode?: boolean
    open?: boolean
    error: string | null
}) {
    const [isAdding, setIsAdding] = useState(false)
    const [isEditing, setIsEditing] = useState(isCreateMode)
    const [selectedServiceId, setSelectedServiceId] = useState<number | ''>('')
    const [selectedPositionId, setSelectedPositionId] = useState<number | ''>('')
    const [assignmentSearch, setAssignmentSearch] = useState('')
    const [firstnameDraft, setFirstnameDraft] = useState(staff?.firstname ?? '')
    const [lastnameDraft, setLastnameDraft] = useState(staff?.lastname ?? '')

    useEffect(() => {
        setIsAdding(false)
        setSelectedServiceId('')
        setSelectedPositionId('')
        setFirstnameDraft(staff?.firstname ?? '')
        setLastnameDraft(staff?.lastname ?? '')
        setIsEditing(isCreateMode)
    }, [staff?.id, isCreateMode])

    const isInEditMode = isCreateMode || isEditing
    const serviceMap = new Map(services.map((service) => [service.id, service.name]))
    const availablePositions = selectedServiceId === '' ? [] : positions.filter((position) => position.service === Number(selectedServiceId))
    const filteredAssignments = (staff?.positions ?? []).filter((position) => {
        const token = `${serviceMap.get(position.service ?? -1) ?? 'Unknown'} - ${position.name}`.toLowerCase()
        return token.includes(assignmentSearch.trim().toLowerCase())
    })
    const assignedServiceNames = Array.from(new Set(
        (staff?.positions ?? [])
            .map((position) => serviceMap.get(position.service ?? -1))
            .filter((name): name is string => Boolean(name)),
    ))
    const positionsGroupedByService = (() => {
        const grouped = new Map<string, StaffPosition[]>()
        filteredAssignments.forEach((position) => {
            const serviceName = serviceMap.get(position.service ?? -1) ?? 'Unassigned'
            const list = grouped.get(serviceName) ?? []
            list.push(position)
            grouped.set(serviceName, list)
        })
        return Array.from(grouped.entries())
    })()
    const hasNameChanges = staff ? firstnameDraft.trim() !== staff.firstname.trim() || lastnameDraft.trim() !== staff.lastname.trim() : false

    const handleOpenAdd = () => {
        setSelectedServiceId('')
        setSelectedPositionId('')
        setIsAdding(true)
    }

    const handleAdd = async () => {
        if (!selectedPositionId) {
            return
        }

        setIsAdding(false)
        await onAddPosition(Number(selectedPositionId))
        setSelectedServiceId('')
        setSelectedPositionId('')
    }

    const handleSaveName = async () => {
        const trimmedFirstname = firstnameDraft.trim()
        const trimmedLastname = lastnameDraft.trim()

        if (!trimmedFirstname || !trimmedLastname) {
            return
        }

        if (isCreateMode) {
            setIsEditing(false)
            if (onCreateStaff) {
                await onCreateStaff(trimmedFirstname, trimmedLastname)
            }
            return
        }

        if (!staff) {
            return
        }

        setIsEditing(false)
        await onUpdateStaffName(trimmedFirstname, trimmedLastname)
    }

    return (
        <DetailDialog
                open={open ?? Boolean(staff)}
                onClose={onClose}
                maxWidth="sm"
                contentSx={{position: 'relative', pb: 2}}
                title={
                    isInEditMode ? (
                       <Stack direction="row" spacing={1.25} sx={{alignItems: 'flex-end', width: '100%'}}>
                           <Stack spacing={0.5} sx={{minWidth: 150, flex: 1}}>
                               <Typography variant="caption" sx={{fontSize: '0.68rem', letterSpacing: 0.2, textTransform: 'uppercase', color: 'text.secondary'}}>
                                   Firstname
                               </Typography>
                               <TextField
                                   size="small"
                                   value={firstnameDraft}
                                   onChange={(event) => setFirstnameDraft(event.target.value)}
                                   onKeyDown={(event) => {
                                       if (event.key === 'Enter') {
                                           event.preventDefault()
                                           if (isCreateMode || hasNameChanges) {
                                               void handleSaveName()
                                           } else {
                                               setIsEditing(false)
                                           }
                                       }
                                   }}
                                   sx={{'& .MuiInputBase-root': {fontSize: '0.96rem', fontWeight: 500, height: 34}}}
                               />
                           </Stack>
                           <Stack spacing={0.5} sx={{minWidth: 150, flex: 1}}>
                               <Typography variant="caption" sx={{fontSize: '0.68rem', letterSpacing: 0.2, textTransform: 'uppercase', color: 'text.secondary'}}>
                                   Lastname
                               </Typography>
                               <TextField
                                   size="small"
                                   value={lastnameDraft}
                                   onChange={(event) => setLastnameDraft(event.target.value)}
                                   onKeyDown={(event) => {
                                       if (event.key === 'Enter') {
                                           event.preventDefault()
                                           if (isCreateMode || hasNameChanges) {
                                               void handleSaveName()
                                           } else {
                                               setIsEditing(false)
                                           }
                                       }
                                   }}
                                   sx={{'& .MuiInputBase-root': {fontSize: '0.96rem', fontWeight: 500, height: 34}}}
                               />
                           </Stack>
                       </Stack>
                    ) : (
                       <Typography variant="h6" sx={{fontWeight: 600}}>
                           {staff ? `${staff.firstname} ${staff.lastname}` : 'Staff details'}
                       </Typography>
                    )
                }
                titleActions={
                    <Stack direction="row" spacing={0.5} sx={{alignItems: 'center'}}>
                       {!isInEditMode && !isCreateMode && (
                           <IconButton
                               aria-label="Edit staff name"
                               onClick={() => setIsEditing(true)}
                               size="small"
                               sx={dialogIconButtonSx}
                           >
                               <EditIcon fontSize="small"/>
                           </IconButton>
                       )}
                       {isInEditMode && (
                           <IconButton
                               color="primary"
                               aria-label="Save staff name"
                               onClick={() => void handleSaveName()}
                               size="small"
                               sx={dialogIconButtonSx}
                           >
                               <CheckIcon fontSize="small"/>
                           </IconButton>
                       )}
                       <IconButton
                           aria-label="Close staff details"
                           onClick={() => {
                               if (isInEditMode) {
                                   if (isCreateMode) {
                                       onClose()
                                       return
                                   }
                                   setIsEditing(false)
                                   setFirstnameDraft(staff?.firstname ?? '')
                                   setLastnameDraft(staff?.lastname ?? '')
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
                {staff ? (
                    <Stack spacing={2}>
                       {error && (
                           <Typography color="error" variant="body2">{error}</Typography>
                       )}

                       <Box>
                           <Typography variant="subtitle2" sx={{fontWeight: 600, color: 'text.secondary', mb: 1}}>
                               Services
                           </Typography>
                           {assignedServiceNames.length > 0 ? (
                               <Stack direction="row" spacing={0.75} sx={{flexWrap: 'wrap', gap: 0.75}}>
                                   {assignedServiceNames.map((name) => (
                                       <Chip key={name} label={name} size="small" color="primary" sx={{fontWeight: 600}}/>
                                   ))}
                               </Stack>
                           ) : (
                               <Typography variant="body2" color="text.secondary">No services assigned</Typography>
                           )}
                       </Box>

                       <Box sx={{border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5, backgroundColor: 'rgba(0,0,0,0.01)'}}>
                           <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1}}>
                               <Typography variant="subtitle2" sx={{fontWeight: 600, color: 'text.secondary'}}>Positions</Typography>
                               {!isAdding && !isCreateMode && (
                                   <Stack direction="row" spacing={1} sx={{alignItems: 'center', flex: 1, justifyContent: 'flex-end'}}>
                                       <TextField
                                           size="small"
                                           placeholder="Search"
                                           value={assignmentSearch}
                                           onChange={(event) => setAssignmentSearch(event.target.value)}
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
                                           aria-label="Add staff position"
                                           size="small"
                                           onClick={handleOpenAdd}
                                           sx={{width: 28, height: 28, borderRadius: 1}}
                                       >
                                           <AddIcon fontSize="small"/>
                                       </IconButton>
                                   </Stack>
                               )}
                           </Box>

                           {isAdding && (
                               <Stack direction="row" spacing={1} sx={{mb: 2, alignItems: 'center', flexWrap: 'wrap'}}>
                                   <FormControl size="small" sx={{minWidth: 170, flex: 1}}>
                                       <InputLabel id="service-select-label">Service</InputLabel>
                                       <Select
                                           labelId="service-select-label"
                                           value={selectedServiceId}
                                           label="Service"
                                           onChange={(event) => {
                                               setSelectedServiceId(event.target.value as number)
                                               setSelectedPositionId('')
                                           }}
                                       >
                                           {services.map((service) => (
                                               <MenuItem key={service.id} value={service.id}>{service.name}</MenuItem>
                                           ))}
                                       </Select>
                                   </FormControl>
                                   <FormControl size="small" sx={{minWidth: 170, flex: 1}}>
                                       <InputLabel id="position-select-label">Position</InputLabel>
                                       <Select
                                           labelId="position-select-label"
                                           value={selectedPositionId}
                                           label="Position"
                                           onChange={(event) => setSelectedPositionId(event.target.value as number)}
                                           disabled={selectedServiceId === ''}
                                       >
                                           {availablePositions.map((position) => (
                                               <MenuItem key={position.id} value={position.id}>{position.name}</MenuItem>
                                           ))}
                                       </Select>
                                   </FormControl>
                                   <Button
                                       variant="contained"
                                       size="small"
                                       disabled={selectedPositionId === ''}
                                       onClick={() => void handleAdd()}
                                   >
                                       Add
                                   </Button>
                               </Stack>
                           )}

                           {positionsGroupedByService.length === 0 ? (
                               <Typography variant="body2" color="text.secondary">
                                   {assignmentSearch.trim() ? 'No matching assignments.' : isCreateMode ? 'No positions assigned yet.' : 'No positions assigned.'}
                               </Typography>
                           ) : (
                               <Stack spacing={1.25} sx={{maxHeight: 280, overflowY: 'auto', pr: 0.5}}>
                                   {positionsGroupedByService.map(([serviceName, servicePositions]) => (
                                       <Box key={serviceName}>
                                           <Typography variant="caption" color="text.secondary" sx={{textTransform: 'uppercase', letterSpacing: 0.3}}>
                                               {serviceName}
                                           </Typography>
                                           <Stack spacing={0.5} sx={{mt: 0.5}}>
                                               {servicePositions.map((position) => (
                                                   <Stack key={position.id} direction="row" spacing={1} sx={{width: '100%', alignItems: 'center'}}>
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
                                                               {position.name}
                                                           </Typography>
                                                       </Box>
                                                       {isInEditMode && !isCreateMode && (
                                                           <IconButton
                                                               aria-label={`Remove position ${position.name}`}
                                                               size="small"
                                                               color="error"
                                                               onClick={() => void onRemovePosition(position.id)}
                                                               sx={{width: 28, height: 28, borderRadius: 1}}
                                                           >
                                                               <DeleteOutlineOutlined fontSize="small"/>
                                                           </IconButton>
                                                       )}
                                                   </Stack>
                                               ))}
                                           </Stack>
                                       </Box>
                                   ))}
                               </Stack>
                           )}

                       </Box>

                       {!isCreateMode && isInEditMode && (
                           <Box sx={{display: 'flex', justifyContent: 'flex-start'}}>
                               <Button
                                   variant="outlined"
                                   color="error"
                                   size="small"
                                   onClick={() => onDeleteStaff?.()}
                                   startIcon={<DeleteOutlineOutlined />}
                                   sx={{height: 36, minHeight: 36, paddingY: 0}}
                               >
                                   Delete staff
                               </Button>
                           </Box>
                       )}
                    </Stack>
                ) : null}
            </DetailDialog>
    )
}

export function StaffPage() {
    const queryClient = useQueryClient()
    const {data: staff = [], isLoading, isError, error} = useQuery<StaffItem[]>({
        queryKey: ['staff'],
        queryFn: getStaff,
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
    const {data: positions = []} = useQuery<PositionItem[]>({
        queryKey: ['positions'],
        queryFn: getPositions,
        retry: false,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    })
    const [selectedStaff, setSelectedStaff] = useState<StaffItem | null>(null)
    const [dialogError, setDialogError] = useState<string | null>(null)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [createDialogError, setCreateDialogError] = useState<string | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [isDeletingStaff, setIsDeletingStaff] = useState(false)

    const rows = getStaffRows(staff, services)

    const handleCreateStaff = async (firstname: string, lastname: string) => {
        try {
            const created = await createStaff(firstname, lastname)
            queryClient.setQueryData(['staff'], (old: StaffItem[] | undefined) => [...(old ?? []), created])
            setCreateDialogOpen(false)
            setCreateDialogError(null)
            setSelectedStaff(created)
        } catch (error) {
            setCreateDialogError(error instanceof Error ? error.message : 'Failed to create staff')
        }
    }

    const handleDeleteStaff = async () => {
        if (!selectedStaff) {
            return
        }

        setIsDeletingStaff(true)

        try {
            await deleteStaff(selectedStaff.id)
            queryClient.setQueryData(['staff'], (old: StaffItem[] | undefined) =>
                (old ?? []).filter((member) => member.id !== selectedStaff.id),
            )
            setDeleteDialogOpen(false)
            setSelectedStaff(null)
            setDialogError(null)
        } catch (error) {
            setDialogError(error instanceof Error ? error.message : 'Failed to delete staff')
        } finally {
            setIsDeletingStaff(false)
        }
    }

    const handleAddPosition = async (positionId: number) => {
        if (!selectedStaff) {
            return
        }

        try {
            await assignStaffPosition(selectedStaff.id, positionId)
            const position = positions.find((item) => item.id === positionId)

            queryClient.setQueryData(['staff'], (old: StaffItem[] | undefined) =>
                (old ?? []).map((member) => {
                    if (member.id !== selectedStaff.id) {
                        return member
                    }

                    if (member.positions.some((item) => item.id === positionId)) {
                        return member
                    }

                    return {
                        ...member,
                        positions: [
                            ...member.positions,
                            {
                                id: positionId,
                                name: position?.name ?? 'Unknown position',
                                service: position?.service ?? undefined,
                            },
                        ],
                    }
                }),
            )

            setSelectedStaff((current) => {
                if (!current) {
                    return current
                }

                if (current.positions.some((item) => item.id === positionId)) {
                    return current
                }

                return {
                    ...current,
                    positions: [
                        ...current.positions,
                        {
                            id: positionId,
                            name: position?.name ?? 'Unknown position',
                            service: position?.service ?? undefined,
                        },
                    ],
                }
            })
            setDialogError(null)
        } catch (error) {
            setDialogError(error instanceof Error ? error.message : 'Failed to add position')
        }
    }

    const handleRemovePosition = async (positionId: number) => {
        if (!selectedStaff) {
            return
        }

        try {
            await removeStaffPosition(selectedStaff.id, positionId)

            queryClient.setQueryData(['staff'], (old: StaffItem[] | undefined) =>
                (old ?? []).map((member) => {
                    if (member.id !== selectedStaff.id) {
                        return member
                    }

                    return {
                        ...member,
                        positions: member.positions.filter((item) => item.id !== positionId),
                    }
                }),
            )

            setSelectedStaff((current) => {
                if (!current) {
                    return current
                }

                return {
                    ...current,
                    positions: current.positions.filter((item) => item.id !== positionId),
                }
            })
            setDialogError(null)
        } catch (error) {
            setDialogError(error instanceof Error ? error.message : 'Failed to remove position')
        }
    }

    return (
        <AppShell maxWidth={false}>
            <Menu/>
            <ContentArea>
                <Panel title="Staff" sx={{height: '100%', position: 'relative'}}>
                    <Box sx={{display: 'flex', justifyContent: 'flex-end', mb: 1}}>
                        <Fab
                            color="primary"
                            aria-label="Add staff"
                            size="medium"
                            onClick={() => {
                                setCreateDialogOpen(true)
                                setCreateDialogError(null)
                            }}
                            sx={{boxShadow: 'none'}}
                        >
                            <AddIcon/>
                        </Fab>
                    </Box>

                    {isLoading && (
                        <Box sx={{display: 'grid', placeItems: 'center', minHeight: 200}}>
                            <CircularProgress/>
                        </Box>
                    )}

                    {isError && (
                        <Typography color="error">{(error as Error)?.message ?? 'Failed to load staff'}</Typography>
                    )}

                    {!isLoading && !isError && (
                        <Box sx={{height: '100%', minHeight: 420}}>
                            <DataGrid
                                rows={rows}
                                columns={staffColumns}
                                showToolbar
                                slots={{toolbar: StaffToolbar}}
                                disableRowSelectionOnClick
                                onRowDoubleClick={(params) => setSelectedStaff(params.row.member)}
                                sx={(theme) => ({
                                    border: 0,
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: 'transparent',
                                    color: theme.palette.text.primary,
                                    borderRadius: 2,
                                    '& .MuiDataGrid-columnHeaders': {
                                        backgroundColor: 'transparent',
                                        borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
                                    },
                                    '& .MuiDataGrid-columnHeaderTitle': {
                                        color: theme.palette.text.secondary,
                                        fontWeight: 600,
                                    },
                                    '& .MuiDataGrid-columnSeparator': {
                                        display: 'none',
                                    },
                                    '& .MuiDataGrid-row': {
                                        backgroundColor: 'transparent',
                                        '&:hover': {
                                            backgroundColor: 'rgba(148, 163, 184, 0.06)',
                                        },
                                    },
                                    '& .MuiDataGrid-cell': {
                                        borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
                                        py: 1.25,
                                        color: theme.palette.text.primary,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'flex-start',
                                    },
                                    '& .MuiDataGrid-cellContent': {
                                        width: '100%',
                                        textAlign: 'left',
                                        display: 'flex',
                                        alignItems: 'center',
                                    },
                                    '& .MuiDataGrid-footerContainer': {
                                        borderTop: '1px solid rgba(148, 163, 184, 0.12)',
                                        backgroundColor: 'transparent',
                                        color: theme.palette.text.secondary,
                                    },
                                    '& .MuiDataGrid-overlay': {
                                        backgroundColor: 'transparent',
                                    },
                                })}
                                density="compact"
                                pageSizeOptions={[10, 25, 50]}
                                initialState={{pagination: {paginationModel: {pageSize: 10, page: 0}}}}
                            />
                        </Box>
                    )}
                </Panel>
            </ContentArea>

            <StaffDetailDialog
                staff={selectedStaff}
                services={services}
                positions={positions}
                onClose={() => {
                    setSelectedStaff(null)
                    setDialogError(null)
                }}
                onAddPosition={handleAddPosition}
                onRemovePosition={handleRemovePosition}
                onUpdateStaffName={async (firstname, lastname) => {
                    if (!selectedStaff) {
                        return
                    }

                    try {
                        const updated = await patchStaff(selectedStaff.id, firstname, lastname)
                        queryClient.setQueryData(['staff'], (old: StaffItem[] | undefined) =>
                            (old ?? []).map((member) => (member.id === selectedStaff.id ? updated : member)),
                        )
                        setSelectedStaff(updated)
                        setDialogError(null)
                    } catch (error) {
                        setDialogError(error instanceof Error ? error.message : 'Failed to update staff name')
                    }
                }}
                onDeleteStaff={() => setDeleteDialogOpen(true)}
                error={dialogError}
            />

            <StaffDetailDialog
                staff={emptyStaff}
                services={services}
                positions={positions}
                isCreateMode
                onClose={() => {
                    setCreateDialogOpen(false)
                    setCreateDialogError(null)
                }}
                onAddPosition={async () => undefined}
                onRemovePosition={async () => undefined}
                onUpdateStaffName={async () => undefined}
                onCreateStaff={async (firstname, lastname) => {
                    await handleCreateStaff(firstname, lastname)
                }}
                error={createDialogError}
                open={createDialogOpen}
            />

            <DetailDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                maxWidth="xs"
                title="Delete staff"
                footer={
                    <>
                        <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">Cancel</Button>
                        <Button onClick={() => void handleDeleteStaff()} color="error" variant="contained" disabled={isDeletingStaff}>
                            {isDeletingStaff ? 'Deleting…' : 'Delete'}
                        </Button>
                    </>
                }
            >
                <Typography variant="body1">
                    This will permanently remove the staff member and all their assignments.
                </Typography>
            </DetailDialog>
        </AppShell>
    )
}
