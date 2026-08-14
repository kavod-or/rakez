import type {ReactNode} from 'react'
import {Paper, Stack, Box, Typography} from '@mui/material'
import type {SxProps} from '@mui/material'
import type {Theme} from '@mui/material/styles'
import {glassSurfaceStyles} from '../ui/GlassBox'

type PanelProps = {
    children?: ReactNode,
    sx?: SxProps<Theme>,
    title?: ReactNode,
    titleSx?: SxProps<Theme>,
}

export function Panel({children, sx, title, titleSx}: PanelProps) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: {xs: 1, sm: 2},
                borderRadius: 4,
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                ...glassSurfaceStyles,
                ...sx,
            }}
        >
            {title && (
                <Box sx={{
                    px: {xs: 1, sm: 2},
                    py: 0.5,
                    minHeight: 48,
                    display: 'flex',
                    alignItems: 'center',
                }}>
                    <Typography variant="h6" sx={{fontWeight: 600, ...titleSx}}>{title}</Typography>
                </Box>
            )}

            <Stack spacing={3} sx={{flexGrow: 1}}>{children}</Stack>
        </Paper>
    )
}
