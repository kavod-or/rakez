import {createTheme} from '@mui/material/styles'

export const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#6d28d9',
        },
        secondary: {
            main: '#0f766e',
        },
        background: {
            default: '#f6f7fb',
            paper: '#ffffff',
        },
        text: {
            primary: '#111827',
            secondary: '#4b5563',
        },
    },
    shape: {
        borderRadius: 4,
    },
    spacing: 8,
    typography: {
        fontFamily: [
            'Inter',
            'system-ui',
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'sans-serif',
        ].join(','),
        h1: {
            fontWeight: 700,
            letterSpacing: '-0.03em',
        },
        h2: {
            fontWeight: 700,
            letterSpacing: '-0.03em',
        },
        h3: {
            fontWeight: 700,
            letterSpacing: '-0.03em',
        },
        h4: {
            fontWeight: 700,
            letterSpacing: '-0.02em',
        },
        button: {
            textTransform: 'none',
            fontWeight: 600,
        },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: '#f6f7fb',
                },
                '*': {
                    boxSizing: 'border-box',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    border: '1px solid rgba(17, 24, 39, 0.08)',
                    boxShadow: '0 12px 30px rgba(17, 24, 39, 0.08)',
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                variant: 'outlined',
                fullWidth: true,
            },
        },
        MuiButton: {
            defaultProps: {
                disableElevation: true,
            },
        },
    },
})
