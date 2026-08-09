import {createTheme} from '@mui/material/styles'

export const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#8b5cf6',
        },
        secondary: {
            main: '#2dd4bf',
        },
        background: {
            default: '#070b14',
            paper: '#0f172a',
        },
        text: {
            primary: '#e5eefc',
            secondary: '#94a3b8',
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
                '*': {
                    boxSizing: 'border-box',
                },
                html: {
                    minHeight: '100%',
                },
                body: {
                    minHeight: '100vh',
                    margin: 0,
                    backgroundColor: '#070b14',
                    backgroundImage: `
            radial-gradient(circle at 20% 20%, transparent 28%),
            radial-gradient(circle at 80% 0%, transparent 24%),
            radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px),
            radial-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px)
          `,
                    backgroundSize: '100% 100%, 100% 100%, 28px 28px, 56px 56px',
                    backgroundPosition: 'center, center, 0 0, 14px 14px',
                    backgroundAttachment: 'fixed',
                    color: '#e5eefc',
                },
                '#root': {
                    minHeight: '100vh',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    border: '1px solid rgba(148, 163, 184, 0.12)',
                    backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.02), transparent)',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
                    backdropFilter: 'blur(14px)',
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
