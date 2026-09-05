import * as React from 'react'
import {styled, useTheme} from '@mui/material/styles'
import type {Theme, CSSObject} from '@mui/material/styles'
import Box from '@mui/material/Box'
import MuiDrawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import LogoutIcon from '@mui/icons-material/Logout'
import {useNavigate} from 'react-router-dom'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import {MenuItem} from './MenuItem'
import {MENU_ITEMS} from './MenuItems'
import wordmark from '../../assets/wordmark.svg'
import {glassSurfaceStyles} from '../ui/GlassBox'
import {getCurrentUser, logout} from '../../api/client'

export const drawerWidth = 240
const menuOpenStorageKey = 'menu-open'

const openedMenu = (theme: Theme): CSSObject => ({
    width: drawerWidth,
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
})

const closedMenu = (theme: Theme): CSSObject => ({
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up('sm')]: {
        width: `calc(${theme.spacing(8)} + 1px)`,
    },
})

const DrawerHeader = styled('div')(({theme}) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
}))

const Drawer = styled(MuiDrawer, {shouldForwardProp: (prop) => prop !== 'open'})<{
    open?: boolean
}>(({theme, open}) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
        ...openedMenu(theme),
        '& .MuiDrawer-paper': {
            ...openedMenu(theme),
            ...glassSurfaceStyles,
        borderTopRightRadius: `${Number(theme.shape.borderRadius) * 2}px`,
        borderBottomRightRadius: `${Number(theme.shape.borderRadius) * 2}px`,
        },
    }),
    ...(!open && {
        ...closedMenu(theme),
        '& .MuiDrawer-paper': {
            ...closedMenu(theme),
            ...glassSurfaceStyles,
        borderTopRightRadius: `${Number(theme.shape.borderRadius) * 2}px`,
        borderBottomRightRadius: `${Number(theme.shape.borderRadius) * 2}px`,
        },
    }),
}))

export function Menu() {
    const theme = useTheme()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const {data: currentUser} = useQuery({
        queryKey: ['current-user'],
        queryFn: getCurrentUser,
        retry: false,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    })
    const [open, setOpen] = React.useState(() => {
        if (typeof window === 'undefined') {
            return true
        }

        const stored = window.localStorage.getItem(menuOpenStorageKey)
        if (stored === null) return true
        return stored === '1'
    })

    const handleLogout = React.useCallback(async () => {
        try {
            await logout()
        } finally {
            queryClient.clear()
            navigate('/login', {replace: true})
        }
    }, [navigate, queryClient])

    React.useEffect(() => {
        window.localStorage.setItem(menuOpenStorageKey, open ? '1' : '0')
    }, [open])

    React.useEffect(() => {
        if (typeof document === 'undefined') return
        if (open) {
            document.body.classList.add('menu-open')
        } else {
            document.body.classList.remove('menu-open')
        }
        return () => {
            document.body.classList.remove('menu-open')
        }
    }, [open])

    const accountLabel = currentUser?.username || 'Account'
    const accountTooltip = currentUser?.username ? `@${currentUser.username}` : 'Account'
    const footerMenuItems = [
        {
            id: 'account',
            label: accountLabel,
            icon: <AccountCircleIcon/>,
            to: '/account',
            tooltip: accountTooltip,
        },
        {
            id: 'logout',
            label: 'Logout',
            icon: <LogoutIcon/>,
            onClick: handleLogout,
            tooltip: 'Logout',
        },
    ]

    return (
        <Drawer variant="permanent" open={open}>
            <Box sx={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                <DrawerHeader>
                    <Box sx={{width: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end'}}>
                        <Box sx={(theme) => ({
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            pointerEvents: 'none',
                            maxWidth: open ? 220 : 0,
                            opacity: open ? 1 : 0,
                            transform: open ? 'none' : 'translateY(-6px)',
                            transition: theme.transitions.create(['max-width', 'opacity', 'transform'], {
                                easing: theme.transitions.easing.sharp,
                                duration: theme.transitions.duration.enteringScreen,
                            }),
                        })}>
                            <Box
                                component="img"
                                src={wordmark}
                                alt="Rakez"
                                sx={{height: 32, display: 'block'}}
                            />
                        </Box>

                        <IconButton onClick={() => setOpen((prev) => !prev)} sx={{zIndex: 1}}>
                            {open
                                ? theme.direction === 'rtl'
                                    ? <ChevronRightIcon/>
                                    : <ChevronLeftIcon/>
                                : <ChevronRightIcon/>}
                        </IconButton>
                    </Box>
                </DrawerHeader>

                <Divider sx={{borderColor: 'rgba(148, 163, 184, 0.22)'}}/>

                <List>
                    {MENU_ITEMS.map((item) => (
                        <MenuItem
                            key={item.id}
                            open={open}
                            label={item.label}
                            icon={item.icon}
                            to={item.to}
                            tooltip={item.tooltip}
                        />
                    ))}
                </List>

                <Box sx={{mt: 'auto'}}>
                    <Divider sx={{borderColor: 'rgba(148, 163, 184, 0.22)'}}/>
                    <List>
                        {footerMenuItems.map((item) => (
                            <MenuItem
                                key={item.id}
                                open={open}
                                label={item.label}
                                icon={item.icon}
                                to={item.to}
                                onClick={item.onClick}
                                tooltip={item.tooltip}
                            />
                        ))}
                    </List>
                </Box>
            </Box>
        </Drawer>
    )
}