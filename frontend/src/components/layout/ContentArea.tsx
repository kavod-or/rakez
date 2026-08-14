import type {ReactNode} from 'react'
import Box from '@mui/material/Box'
import {useTheme} from '@mui/material/styles'
import type {SxProps} from '@mui/material'
import type {Theme} from '@mui/material/styles'
import {drawerWidth} from './Menu'

type Padding = number | { xs?: number; sm?: number }

type ContentAreaProps = {
  children: ReactNode
  sx?: SxProps<Theme>
  padding?: Padding
}

export function ContentArea({children, sx, padding = {xs: 1, sm: 2}}: ContentAreaProps) {
  const theme = useTheme()

  const base = {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up('sm')]: {
      left: `calc(${theme.spacing(8)} + 1px)`,
    },
    // animate left so the content moves with the drawer transition
    transition: theme.transitions.create('left', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    // when the menu is open we rely on the body.menu-open class set by the Menu component
    'body.menu-open &': {
      left: `${drawerWidth}px`,
    },
    p: padding,
    overflow: 'auto',
    boxSizing: 'border-box',
  } as const

  const merged = [base, sx] as SxProps<Theme>

  return <Box sx={merged}>{children}</Box>
}
