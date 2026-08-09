import type {ReactNode} from 'react'
import {Paper, Stack} from '@mui/material'

type PanelProps = {
    children: ReactNode,
    sx?: { width: number }
}

export function Panel({children}: PanelProps) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: {xs: 3, sm: 4},
                borderRadius: 4,
                backgroundColor: 'background.paper',
            }}
        >
            <Stack spacing={3}>{children}</Stack>
        </Paper>
    )
}
