import Box from '@mui/material/Box'
import {styled} from '@mui/material/styles'

export const glassSurfaceStyles = {
    // more transparent so underlying background shows through more
    backgroundColor: 'rgba(15, 23, 42, 0.06)',
    // slightly less blur to reveal background details
    backdropFilter: 'blur(4px) saturate(100%)',
    WebkitBackdropFilter: 'blur(4px) saturate(100%)',
    borderRight: '1px solid rgba(148, 163, 184, 0.12)',
    // lighter shadow so it reads more like a subtle elevation
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.28)',
}

export const GlassBox = styled(Box)(glassSurfaceStyles)
