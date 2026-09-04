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
    titleActions?: ReactNode,
    rightDrawer?: ReactNode,
}

export function Panel({children, sx, title, titleSx, titleActions, rightDrawer}: PanelProps) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: {xs: 1, sm: 2},
                borderRadius: 4,
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                overflow: 'auto',
                ...glassSurfaceStyles,
                ...sx,
            }}
        >
            {(title || titleActions) && (
                <Box sx={{
                    px: {xs: 1, sm: 2},
                    py: 0.5,
                    minHeight: 48,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    flexWrap: 'wrap',
                }}>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', minWidth: 0}}>
                        {typeof title === 'string' ? (
                            <Typography variant="h6" sx={{fontWeight: 600, ...titleSx}}>{title}</Typography>
                        ) : (
                            title
                        )}
                        {titleActions}
                    </Box>
                </Box>
            )}

            <Box sx={{display: 'flex', flexGrow: 1, minHeight: 0, minWidth: 0}}>
                <Stack spacing={3} sx={{flexGrow: 1, minWidth: 0}}>{children}</Stack>
                {rightDrawer}
            </Box>
        </Paper>
    )
}
