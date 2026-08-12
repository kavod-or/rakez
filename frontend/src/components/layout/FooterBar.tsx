import GitHubIcon from '@mui/icons-material/GitHub'
import {Box, Link, Typography} from '@mui/material'

type FooterBarProps = {
    text?: string
}

export function FooterBar({text = '© Rakez'}: FooterBarProps) {
    return (
        <Box
            component="footer"
            sx={{
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                zIndex: (theme) => theme.zIndex.appBar,
                py: 1.5,
                px: 2,
                borderTop: '1px solid rgba(148, 163, 184, 0.12)',
                backgroundColor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}
        >
            <Typography variant="caption" color="text.secondary">
                {text}
            </Typography>

            <Link
                href="https://github.com/kavod-or/rakez"
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                color="text.secondary"
                sx={{display: 'inline-flex', alignItems: 'center', gap: 0.75}}
            >
                <GitHubIcon fontSize="small"/>
                Repository
            </Link>
        </Box>
    )
}