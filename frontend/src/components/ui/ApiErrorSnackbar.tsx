import {Snackbar, Alert} from '@mui/material'

type ApiErrorSnackbarProps = {
  open: boolean
  message: string | null
  onClose: () => void
}

export function ApiErrorSnackbar({open, message, onClose}: ApiErrorSnackbarProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={onClose}
      anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
    >
      <Alert severity="error" variant="filled" onClose={onClose}>
        {message}
      </Alert>
    </Snackbar>
  )
}