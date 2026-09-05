import {forwardRef, useImperativeHandle, useMemo, useState} from 'react'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import {
    Avatar,
    Box,
    Button,
    Card,
    CardActionArea,
    Chip,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CheckIcon from '@mui/icons-material/Check'
import AddIcon from '@mui/icons-material/Add'
import InputAdornment from '@mui/material/InputAdornment'
import {emptyStaff, StaffDetailDialog} from '../pages/Staff'
import {DetailDialog} from './ui/DetailDialog'
import {
    assignStaffPosition,
    createStaff,
    deleteStaff,
    getPositions,
    getServices,
    getStaff,
    patchStaff,
    removeStaffPosition,
} from '../api/client'
import type {PositionItem, ServiceItem, StaffItem} from '../api/client'

const SEARCH_FILTERS_STORAGE_KEY = 'staff-sidebar-search-filters'
const DEFAULT_SEARCH_FILTERS = ['name', 'service', 'position']

// Search text should survive the sidebar/drawer opening and closing (component
// remounts), but must reset on a full page refresh or new session — so it is
// kept in a module-level variable instead of persisted storage.
let inMemorySearch = ''

function loadStoredSearchFilters(): string[] {
    try {
        const raw = localStorage.getItem(SEARCH_FILTERS_STORAGE_KEY)
        if (!raw) return DEFAULT_SEARCH_FILTERS

        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed
        }
        return DEFAULT_SEARCH_FILTERS
    } catch {
        return DEFAULT_SEARCH_FILTERS
    }
}

function getInitials(member: StaffItem) {
    return `${member.firstname.charAt(0)}${member.lastname.charAt(0)}`.toUpperCase()
}

function getAssignedServiceNames(member: StaffItem, serviceNames: Map<number, string>): string[] {
    return Array.from(new Set(
        member.positions
            .map((position) => serviceNames.get(position.service ?? -1))
            .filter((name): name is string => Boolean(name)),
    ))
}

function StaffCard({member, serviceNames, onSelect}: {
    member: StaffItem
    serviceNames: Map<number, string>
    onSelect: (member: StaffItem) => void
}) {
    const assignedServices = getAssignedServiceNames(member, serviceNames)

    return (
        <Card
            elevation={0}
            sx={{
                backgroundColor: 'rgba(15, 23, 42, 0.45)',
                border: '1px solid rgba(148, 163, 184, 0.16)',
            }}
        >
            <CardActionArea onClick={() => onSelect(member)} sx={{p: 1.25}}>
                <Stack direction="row" spacing={1.25} sx={{alignItems: 'center', minWidth: 0}}>
                    <Avatar sx={{width: 32, height: 32, fontSize: '0.8rem', backgroundColor: 'primary.main', color: 'primary.contrastText', fontWeight: 700}}>
                        {getInitials(member)}
                    </Avatar>
                    <Box sx={{minWidth: 0, flex: 1}}>
                        <Typography variant="body2" sx={{fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                            {member.firstname} {member.lastname}
                        </Typography>
                        {assignedServices.length > 0 ? (
                            <Stack direction="row" spacing={0.5} sx={{mt: 0.5, flexWrap: 'wrap', gap: 0.5}}>
                                {assignedServices.map((name) => (
                                    <Chip key={name} label={name} size="small" sx={{height: 18, fontSize: '0.65rem', fontWeight: 600}}/>
                                ))}
                            </Stack>
                        ) : (
                            <Typography variant="caption" color="text.secondary">No services assigned</Typography>
                        )}
                    </Box>
                </Stack>
            </CardActionArea>
        </Card>
    )
}

export type StaffSidebarListHandle = {
    openCreateDialog: () => void
}

export const StaffSidebarList = forwardRef<StaffSidebarListHandle>(function StaffSidebarList(_props, ref) {
    const queryClient = useQueryClient()
    const {data: staff = []} = useQuery<StaffItem[]>({
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

    const [search, setSearch] = useState(() => inMemorySearch)
    const [searchFilters, setSearchFilters] = useState<string[]>(loadStoredSearchFilters)
    const [selectedStaff, setSelectedStaff] = useState<StaffItem | null>(null)
    const [dialogError, setDialogError] = useState<string | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [isDeletingStaff, setIsDeletingStaff] = useState(false)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [createDialogError, setCreateDialogError] = useState<string | null>(null)

    useImperativeHandle(ref, () => ({
        openCreateDialog: () => {
            setCreateDialogOpen(true)
            setCreateDialogError(null)
        },
    }), [])

    const serviceNames = useMemo(() => new Map(services.map((service) => [service.id, service.name])), [services])

    const filteredStaff = staff.filter((member) => {
        const query = search.trim().toLowerCase()
        if (!query) return true

        if (searchFilters.includes('name')) {
            const nameToken = `${member.firstname} ${member.lastname}`.toLowerCase()
            if (nameToken.includes(query)) return true
        }

        if (searchFilters.includes('service')) {
            const assignedServices = getAssignedServiceNames(member, serviceNames)
            if (assignedServices.some((name) => name.toLowerCase().includes(query))) return true
        }

        if (searchFilters.includes('position')) {
            if (member.positions.some((position) => position.name.toLowerCase().includes(query))) return true
        }

        return false
    })

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

    const handleUpdateStaffName = async (firstname: string, lastname: string) => {
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

    const handleCreateStaff = async (firstname: string, lastname: string) => {
        try {
            const created = await createStaff(firstname, lastname)
            queryClient.setQueryData(['staff'], (old: StaffItem[] | undefined) => [...(old ?? []), created])
            setCreateDialogOpen(false)
            setCreateDialogError(null)
        } catch (error) {
            setCreateDialogError(error instanceof Error ? error.message : 'Failed to create staff')
        }
    }

    return (
        <Stack spacing={1.25}>
            <Stack spacing={0.5}>
                <ToggleButtonGroup
                    value={searchFilters}
                    onChange={(_event, value: string[]) => {
                        if (value.length > 0) {
                            setSearchFilters(value)
                            try {
                                localStorage.setItem(SEARCH_FILTERS_STORAGE_KEY, JSON.stringify(value))
                            } catch {
                                // ignore storage errors (e.g. private mode)
                            }
                        }
                    }}
                    size="small"
                    sx={{
                        alignSelf: 'flex-start',
                        gap: 0.5,
                        '& .MuiToggleButton-root': {
                            px: 1.25,
                            py: 0.25,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            textTransform: 'none',
                            lineHeight: 1.4,
                            borderRadius: '16px !important',
                            border: '1px solid rgba(148, 163, 184, 0.3)',
                            color: 'text.secondary',
                            '&.Mui-selected': {
                                backgroundColor: 'primary.main',
                                color: 'primary.contrastText',
                                borderColor: 'primary.main',
                                '&:hover': {
                                    backgroundColor: 'primary.dark',
                                },
                            },
                        },
                    }}
                >
                    <ToggleButton value="name" aria-label="Search by name">
                        <CheckIcon fontSize="inherit" sx={{fontSize: 14, mr: 0.5, visibility: searchFilters.includes('name') ? 'visible' : 'hidden'}}/>
                        Name
                    </ToggleButton>
                    <ToggleButton value="service" aria-label="Search by service">
                        <CheckIcon fontSize="inherit" sx={{fontSize: 14, mr: 0.5, visibility: searchFilters.includes('service') ? 'visible' : 'hidden'}}/>
                        Service
                    </ToggleButton>
                    <ToggleButton value="position" aria-label="Search by position">
                        <CheckIcon fontSize="inherit" sx={{fontSize: 14, mr: 0.5, visibility: searchFilters.includes('position') ? 'visible' : 'hidden'}}/>
                        Position
                    </ToggleButton>
                </ToggleButtonGroup>
            </Stack>

            <TextField
                size="small"
                placeholder="Search staff"
                value={search}
                onChange={(event) => {
                    const value = event.target.value
                    setSearch(value)
                    inMemorySearch = value
                }}
                fullWidth
                slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small"/>
                            </InputAdornment>
                        ),
                    },
                }}
            />

            <Stack spacing={1}>
                {filteredStaff.length === 0 ? (
                    <Stack spacing={1} sx={{alignItems: 'flex-start'}}>
                        <Typography variant="body2" color="text.secondary">
                            {search.trim() ? 'No matching staff.' : 'No staff members yet.'}
                        </Typography>
                        <Button
                            size="small"
                            startIcon={<AddIcon fontSize="small"/>}
                            onClick={() => {
                                setCreateDialogOpen(true)
                                setCreateDialogError(null)
                            }}
                        >
                            Add staff
                        </Button>
                    </Stack>
                ) : (
                    filteredStaff.map((member) => (
                        <StaffCard
                            key={member.id}
                            member={member}
                            serviceNames={serviceNames}
                            onSelect={setSelectedStaff}
                        />
                    ))
                )}
            </Stack>

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
                onUpdateStaffName={handleUpdateStaffName}
                onDeleteStaff={() => setDeleteDialogOpen(true)}
                error={dialogError}
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
                onCreateStaff={handleCreateStaff}
                error={createDialogError}
                open={createDialogOpen}
            />
        </Stack>
    )
})
