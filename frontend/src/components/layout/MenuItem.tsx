import type {ReactNode} from 'react'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'

type MenuItemProps = {
    open: boolean
    label: string
    icon: ReactNode
}

export function MenuItem({open, label, icon}: MenuItemProps) {
    return (
        <ListItem disablePadding sx={{display: 'block'}}>
            <ListItemButton sx={{minHeight: 48, px: 2.5, justifyContent: open ? 'initial' : 'center'}}>
                <ListItemIcon sx={{minWidth: 0, justifyContent: 'center', mr: open ? 3 : 'auto'}}>
                    {icon}
                </ListItemIcon>
                <ListItemText primary={label} sx={{opacity: open ? 1 : 0}}/>
            </ListItemButton>
        </ListItem>
    )
}
