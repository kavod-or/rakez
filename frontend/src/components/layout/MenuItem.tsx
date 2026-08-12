import type {ReactNode} from 'react'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Tooltip from '@mui/material/Tooltip'
import {Link as RouterLink} from 'react-router-dom'
import Fade from '@mui/material/Fade'

type MenuItemProps = {
    open: boolean
    label: string
    icon: ReactNode
    to: string
    tooltip: string
}

export function MenuItem({open, label, icon, to, tooltip}: MenuItemProps) {
    return (
        <ListItem disablePadding sx={{display: 'block'}}>
            <ListItemButton
                component={RouterLink}
                to={to}
                sx={{
                    minHeight: 48,
                    px: 2.5,
                    justifyContent: open ? 'initial' : 'center',
                    '&:hover': {
                        backgroundColor: open ? 'action.hover' : 'transparent',
                    },
                }}
            >
                <ListItemIcon
                    sx={{
                        minWidth: 0,
                        justifyContent: 'center',
                        mr: open ? 3 : 'auto',
                        borderRadius: '50%',
                        p: 0.5,
                        transition: (theme) => theme.transitions.create('background-color'),
                        '&:hover': {
                            backgroundColor: open ? 'transparent' : 'action.hover',
                        },
                    }}
                >
                    <Tooltip
                        title={tooltip}
                        disableHoverListener={open}
                        placement="right"
                        slots={{
                            transition: Fade,
                        }}
                        slotProps={{
                            transition: {timeout: 600},
                        }}
                        enterDelay={2000}

                    >
                        <span>{icon}</span>
                    </Tooltip>
                </ListItemIcon>
                <ListItemText primary={label} sx={{opacity: open ? 1 : 0}}/>
            </ListItemButton>
        </ListItem>
    )
}
