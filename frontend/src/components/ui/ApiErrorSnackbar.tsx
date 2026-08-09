import {Alert, Snackbar} from '@mui/material'

type ApiErrorSnackbarProps = {
    error: Error | null
    onClose: () => void
    autoHideDuration?: number
}

export function ApiErrorSnackbar({
    error,
    onClose,
    autoHideDuration = 3000,
}: ApiErrorSnackbarProps) {
    return (
        <Snackbar
            key={error?.message ?? 'closed'}
            open={Boolean(error)}
            autoHideDuration={autoHideDuration}
            onClose={onClose}
            anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
        >
            <Alert severity="error" variant="filled" onClose={onClose}>
                {error?.message}
            </Alert>
        </Snackbar>
    )
}