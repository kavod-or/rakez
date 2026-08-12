// frontend/src/routes/ProtectedRoute.tsx
import {Navigate, Outlet, useLocation} from 'react-router-dom'
import {useQuery} from '@tanstack/react-query'
import {Box, CircularProgress} from '@mui/material'
import {getCurrentUser} from '../api/client'

export function ProtectedRoute() {
    const location = useLocation()
    const {data: user, isPending, isFetching} = useQuery({
        queryKey: ['current-user'],
        queryFn: getCurrentUser,
        retry: false,
    })

    if (isPending || isFetching) {
        return (
            <Box sx={{minHeight: '70svh', display: 'grid', placeItems: 'center'}}>
                <CircularProgress/>
            </Box>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace state={{from: location}}/>
    }

    return <Outlet/>
}