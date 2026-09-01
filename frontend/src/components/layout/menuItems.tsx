import rakezIcon from '../../assets/rakez_icon.svg'
import EventIcon from '@mui/icons-material/Event'
import PeopleIcon from '@mui/icons-material/People'
import WorkIcon from '@mui/icons-material/Work'
import type {ReactNode} from 'react'
import {Box} from '@mui/material'

export type MenuDefinition = {
    id: string
    label: string
    icon: ReactNode
    to: string,
    tooltip: string
}

export const MENU_ITEMS: MenuDefinition[] = [
    {
        id: 'planner',
        label: 'Planner',
        to: '/dashboard',
        icon: (
            <Box
                component="img"
                src={rakezIcon}
                alt=""
                aria-hidden
                sx={{
                    width: 24,
                    height: 24,
                    display: 'block',
                    objectFit: 'contain',
                }}
            />
        ),
        tooltip: 'Planner'
    },
    {id: 'events', label: 'Events', to: '/events', icon: <EventIcon/>, tooltip: 'Events'},
    {id: 'staff', label: 'Staff', to: '/staff', icon: <PeopleIcon/>, tooltip: 'Staff'},
    {id: 'services', label: 'Services', to: '/services', icon: <WorkIcon/>, tooltip: 'Services'},
]
