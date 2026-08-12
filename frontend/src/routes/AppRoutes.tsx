// frontend/src/routes/AppRoutes.tsx
import {Route, Routes, Navigate} from 'react-router-dom'
import {DashboardPage} from '../pages/DashboardPage'
import {LoginPage} from '../pages/LoginPage'
import {ProtectedRoute} from './ProtectedRoute'

export function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
            <Route path="/login" element={<LoginPage/>}/>

            <Route element={<ProtectedRoute/>}>
                <Route path="/dashboard" element={<DashboardPage/>}/>
            </Route>
        </Routes>
    )
}