import {useMemo, useState} from 'react'
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
    Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import InputAdornment from '@mui/material/InputAdornment'
import {StaffDetailDialog} from '../pages/Staff'
import {DetailDialog} from './ui/DetailDialog'
import {
    assignStaffPosition,
    deleteStaff,
    getPositions,
    getServices,
    getStaff,
    patchStaff,
    removeStaffPosition,
} from '../api/client'
import type {PositionItem, ServiceItem, StaffItem} from '../api/client'

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

export function StaffSidebarList() {
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

    const [search, setSearch] = useState('')
    const [selectedStaff, setSelectedStaff] = useState<StaffItem | null>(null)
    const [dialogError, setDialogError] = useState<string | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [isDeletingStaff, setIsDeletingStaff] = useState(false)

    const serviceNames = useMemo(() => new Map(services.map((service) => [service.id, service.name])), [services])

    const filteredStaff = staff.filter((member) => {
        const query = search.trim().toLowerCase()
        if (!query) return true

        const nameToken = `${member.firstname} ${member.lastname}`.toLowerCase()
        if (nameToken.includes(query)) return true

        const assignedServices = getAssignedServiceNames(member, serviceNames)
        return assignedServices.some((name) => name.toLowerCase().includes(query))
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

    return (
        <Stack spacing={1.25}>
            <TextField
                size="small"
                placeholder="Search staff"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
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
                    <Typography variant="body2" color="text.secondary">
                        {search.trim() ? 'No matching staff.' : 'No staff members yet.'}
                    </Typography>
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
        </Stack>
    )
}
