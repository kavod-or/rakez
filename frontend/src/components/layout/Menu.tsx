import * as React from 'react'
import {styled, useTheme} from '@mui/material/styles'
import type {Theme, CSSObject} from '@mui/material/styles'
import MuiDrawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import MenuIcon from '@mui/icons-material/Menu'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import {MenuItem} from './MenuItem'
import {MENU_ITEMS} from './menuItems'

const drawerWidth = 240

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
        '& .MuiDrawer-paper': openedMenu(theme),
    }),
    ...(!open && {
        ...closedMenu(theme),
        '& .MuiDrawer-paper': closedMenu(theme),
    }),
}))

export function Menu() {
    const theme = useTheme()
    const [open, setOpen] = React.useState(false)

    return (
        <Drawer variant="permanent" open={open}>
            <DrawerHeader>
                <IconButton onClick={() => setOpen((prev) => !prev)}>
                    {open
                        ? theme.direction === 'rtl'
                            ? <ChevronRightIcon/>
                            : <ChevronLeftIcon/>
                        : <MenuIcon/>}
                </IconButton>
            </DrawerHeader>

            <Divider/>

            <List>
                {MENU_ITEMS.map((item) => (
                    <MenuItem key={item.id} open={open} label={item.label} icon={item.icon} />
                ))}
            </List>
        </Drawer>
    )
}