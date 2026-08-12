import Box from '@mui/material/Box'
import {styled} from '@mui/material/styles'

export const glassSurfaceStyles = {
    backgroundColor: 'rgba(15, 23, 42, 0.1)',
    backdropFilter: 'blur(6px) saturate(100%)',
    WebkitBackdropFilter: 'blur(6px) saturate(100%)',
    borderRight: '1px solid rgba(148, 163, 184, 0.2)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
}

export const GlassBox = styled(Box)(glassSurfaceStyles)
