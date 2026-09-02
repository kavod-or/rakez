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
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    height: '100dvh',
    maxHeight: '100dvh',
    minHeight: 0,
  } as const

  const merged = [base, sx] as SxProps<Theme>

  return (
    <Box sx={merged}>
      <Box
        sx={{
          flex: '1 1 auto',
          minWidth: 0,
          minHeight: 0,
          width: '100%',
          overflow: 'hidden',
          boxSizing: 'border-box',
          p: padding,
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
