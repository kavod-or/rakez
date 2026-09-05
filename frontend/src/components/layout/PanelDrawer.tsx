import {useTheme} from '@mui/material/styles'
import {useRef, useState} from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Typography from '@mui/material/Typography'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import AddIcon from '@mui/icons-material/Add'
import {ActiveEventSelector} from '../ActiveEventSelector'
import {StaffSidebarList, type StaffSidebarListHandle} from '../StaffSidebarList'
import {EventDetails} from '../EventDetails'

const OPEN_WIDTH = '22%'
const CLOSED_WIDTH = 48
const EVENT_ACCORDION_STORAGE_KEY = 'dashboard-panel-drawer-event-expanded'
const STAFF_ACCORDION_STORAGE_KEY = 'dashboard-panel-drawer-staff-expanded'

function loadStoredExpanded(key: string, defaultValue: boolean): boolean {
    try {
        const raw = localStorage.getItem(key)
        return raw === null ? defaultValue : raw === 'true'
    } catch {
        return defaultValue
    }
}

type PanelDrawerProps = {
    open: boolean
    onToggle: () => void
}

export function PanelDrawer({open, onToggle}: PanelDrawerProps) {
    const theme = useTheme()
    const [eventExpanded, setEventExpanded] = useState(() => loadStoredExpanded(EVENT_ACCORDION_STORAGE_KEY, true))
    const [staffExpanded, setStaffExpanded] = useState(() => loadStoredExpanded(STAFF_ACCORDION_STORAGE_KEY, true))
    const staffListRef = useRef<StaffSidebarListHandle>(null)

    const handleEventExpandedChange = (_event: React.SyntheticEvent, isExpanded: boolean) => {
        setEventExpanded(isExpanded)
        try {
            localStorage.setItem(EVENT_ACCORDION_STORAGE_KEY, String(isExpanded))
        } catch {
            // ignore storage errors (e.g. private mode)
        }
    }

    const handleStaffExpandedChange = (_event: React.SyntheticEvent, isExpanded: boolean) => {
        setStaffExpanded(isExpanded)
        try {
            localStorage.setItem(STAFF_ACCORDION_STORAGE_KEY, String(isExpanded))
        } catch {
            // ignore storage errors (e.g. private mode)
        }
    }

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
                        expanded={eventExpanded}
                        onChange={handleEventExpandedChange}
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
                        expanded={staffExpanded}
                        onChange={handleStaffExpandedChange}
                        sx={{
                            backgroundColor: 'transparent',
                            '&:before': {display: 'none'},
                        }}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 1}}>
                                <Typography variant="subtitle2" sx={{fontWeight: 600}}>Staff</Typography>
                                {staffExpanded && (
                                    <IconButton
                                        aria-label="Add staff"
                                        size="small"
                                        onClick={(event) => {
                                            event.stopPropagation()
                                            staffListRef.current?.openCreateDialog()
                                        }}
                                        onMouseDown={(event) => event.stopPropagation()}
                                        sx={{width: 24, height: 24}}
                                    >
                                        <AddIcon fontSize="small"/>
                                    </IconButton>
                                )}
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <StaffSidebarList ref={staffListRef}/>
                        </AccordionDetails>
                    </Accordion>
                </Box>
            )}
        </Box>
    )
}
