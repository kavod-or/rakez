import {Dialog, DialogActions, DialogContent, DialogTitle, Box} from '@mui/material'
import type {SxProps, Theme} from '@mui/material/styles'
import type {ReactNode} from 'react'

type DetailDialogProps = {
    open: boolean
    onClose: () => void
    title: ReactNode
    titleActions?: ReactNode
    children: ReactNode
    footer?: ReactNode
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false
    contentSx?: SxProps<Theme>
}

export function DetailDialog({
    open,
    onClose,
    title,
    titleActions,
    children,
    footer,
    maxWidth = 'sm',
    contentSx,
}: DetailDialogProps) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth>
            <DialogTitle sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1}}>
                <Box sx={{flex: 1, minWidth: 0}}>{title}</Box>
                {titleActions ? <Box>{titleActions}</Box> : null}
            </DialogTitle>

            <DialogContent dividers sx={{position: 'relative', pb: 2, ...contentSx}}>
                {children}
            </DialogContent>

            {footer ? <DialogActions>{footer}</DialogActions> : null}
        </Dialog>
    )
}
