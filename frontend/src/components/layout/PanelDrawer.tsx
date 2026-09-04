import {useTheme} from '@mui/material/styles'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Typography from '@mui/material/Typography'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {ActiveEventSelector} from '../ActiveEventSelector'
import {StaffSidebarList} from '../StaffSidebarList'
import {EventDetails} from '../EventDetails'

const OPEN_WIDTH = '22%'
const CLOSED_WIDTH = 48

type PanelDrawerProps = {
    open: boolean
    onToggle: () => void
}

export function PanelDrawer({open, onToggle}: PanelDrawerProps) {
    const theme = useTheme()

    return (
        <Box
            sx={{
                position: 'relative',
                flexShrink: 0,
                height: '100%',
                minHeight: 0,
                width: open ? OPEN_WIDTH : CLOSED_WIDTH,
                minWidth: open ? 240 : CLOSED_WIDTH,
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                borderLeft: open ? '1px solid rgba(148, 163, 184, 0.12)' : 'none',
                transition: theme.transitions.create(['width', 'min-width'], {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                }),
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 0.5,
                }}
            >
                <IconButton onClick={onToggle} size="small" aria-label={open ? 'Collapse panel' : 'Expand panel'}>
                    {open
                        ? (theme.direction === 'rtl' ? <ChevronLeftIcon fontSize="small"/> : <ChevronRightIcon fontSize="small"/>)
                        : (theme.direction === 'rtl' ? <ChevronRightIcon fontSize="small"/> : <ChevronLeftIcon fontSize="small"/>)}
                </IconButton>
            </Box>

            {open && (
                <Box sx={{mt: 5, overflowY: 'auto', overflowX: 'hidden', flexGrow: 1, px: 0.5}}>
                    <Accordion
                        disableGutters
                        elevation={0}
                        sx={{
                            backgroundColor: 'transparent',
                            '&:before': {display: 'none'},
                        }}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                            <Typography variant="subtitle2" sx={{fontWeight: 600}}>Event</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <ActiveEventSelector fullWidth/>
                            <EventDetails/>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion
                        disableGutters
                        elevation={0}
                        sx={{
                            backgroundColor: 'transparent',
                            '&:before': {display: 'none'},
                        }}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                            <Typography variant="subtitle2" sx={{fontWeight: 600}}>Staff</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <StaffSidebarList/>
                        </AccordionDetails>
                    </Accordion>
                </Box>
            )}
        </Box>
    )
}
