import {useQuery} from '@tanstack/react-query'
import {Box, CircularProgress, Typography} from '@mui/material'
import {DataGrid, type GridColDef} from '@mui/x-data-grid'

import {AppShell} from '../components/layout/AppShell'
import {Menu} from '../components/layout/Menu'
import {Panel} from '../components/layout/Panel'
import {ContentArea} from '../components/layout/ContentArea'
import {getStaff} from '../api/client'
import type {StaffItem} from '../api/client'

export function StaffPage() {
    const {data: staff = [], isLoading, isError, error} = useQuery<StaffItem[]>({
        queryKey: ['staff'],
        queryFn: getStaff,
        retry: false,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    })

    const rows = staff.map((member) => ({
        id: member.id,
        firstname: member.firstname,
        lastname: member.lastname,
        positions: member.positions.map((position) => position.name).join(', ') || '—',
    }))

    const columns: GridColDef[] = [
        {field: 'firstname', headerName: 'First name', flex: 1, minWidth: 160},
        {field: 'lastname', headerName: 'Last name', flex: 1, minWidth: 160},
        {field: 'positions', headerName: 'Positions', flex: 2, minWidth: 220},
    ]

    return (
        <AppShell maxWidth={false}>
            <Menu/>
            <ContentArea>
                <Panel title="Staff" sx={{height: '100%'}}>
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
                                columns={columns}
                                disableRowSelectionOnClick
                                sx={(theme) => ({
                                    border: 0,
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: theme.palette.background.paper,
                                    borderRadius: 2,
                                    '& .MuiDataGrid-columnHeaders': {
                                        backgroundColor: theme.palette.action.hover,
                                        borderBottom: '1px solid rgba(0,0,0,0.06)',
                                    },
                                    '& .MuiDataGrid-columnSeparator': {
                                        display: 'none',
                                    },
                                    '& .MuiDataGrid-row': {
                                        '&:hover': {
                                            backgroundColor: theme.palette.action.hover,
                                        },
                                    },
                                    '& .MuiDataGrid-cell': {
                                        borderBottom: '1px solid rgba(0,0,0,0.04)',
                                        py: 1.25,
                                    },
                                    '& .MuiDataGrid-footerContainer': {
                                        borderTop: '1px solid rgba(0,0,0,0.06)',
                                        backgroundColor: theme.palette.background.paper,
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
        </AppShell>
    )
}