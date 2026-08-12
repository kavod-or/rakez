import rakezIcon from '../../assets/rakez_icon.svg'
import EventIcon from '@mui/icons-material/Event'
import PeopleIcon from '@mui/icons-material/People'
import type {ReactNode} from 'react'
import {Box} from "@mui/material";

export type MenuDefinition = {
    id: string
    label: string
    icon: ReactNode
}

export const MENU_ITEMS: MenuDefinition[] = [
    {
        id: 'planner',
        label: 'Planner',
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
        )
    },
    {id: 'events', label: 'Events', icon: <EventIcon/>},
    {id: 'staff', label: 'Staff', icon: <PeopleIcon/>},
]
