// frontend/src/routes/AppRoutes.tsx
import {Route, Routes, Navigate} from 'react-router-dom'
import {DashboardPage} from '../pages/DashboardPage'
import {LoginPage} from '../pages/LoginPage'
import {ProtectedRoute} from './ProtectedRoute'
import {EventsPage} from "../pages/Events.tsx";
import {StaffPage} from "../pages/Staff.tsx";
import {AccountPage} from "../pages/Account.tsx";

export function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
            <Route path="/login" element={<LoginPage/>}/>

            <Route element={<ProtectedRoute/>}>
                <Route path="/dashboard" element={<DashboardPage/>}/>
                <Route path="/events" element={<EventsPage/>}/>
                <Route path="/staff" element={<StaffPage/>}/>
                <Route path="/account" element={<AccountPage/>}/>
            </Route>
        </Routes>
    )
}