import {useTheme} from '@mui/material/styles'
import {useRef, useState} from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import AddIcon from '@mui/icons-material/Add'
import {ActiveEventSelector} from '../ActiveEventSelector'
import {ActiveServiceSelector} from '../ActiveServiceSelector'
import {StaffSidebarList, type StaffSidebarListHandle} from '../StaffSidebarList'
import {EventDetails} from '../EventDetails'
import {usePlannerTimeRange} from '../../api/client'

const OPEN_WIDTH = '22%'
const OPEN_MAX_WIDTH = 375
const CLOSED_WIDTH = 48
const SETTINGS_ACCORDION_STORAGE_KEY = 'dashboard-panel-drawer-settings-expanded'
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
    const [settingsExpanded, setSettingsExpanded] = useState(() => loadStoredExpanded(SETTINGS_ACCORDION_STORAGE_KEY, true))
    const [staffExpanded, setStaffExpanded] = useState(() => loadStoredExpanded(STAFF_ACCORDION_STORAGE_KEY, true))
    const staffListRef = useRef<StaffSidebarListHandle>(null)
    const [plannerTimeRange, setPlannerTimeRange] = usePlannerTimeRange()
    const hours = Array.from({length: 24}, (_, hour) => hour)

    const handleSettingsExpandedChange = (_event: React.SyntheticEvent, isExpanded: boolean) => {
        setSettingsExpanded(isExpanded)
        try {
            localStorage.setItem(SETTINGS_ACCORDION_STORAGE_KEY, String(isExpanded))
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
                maxWidth: open ? OPEN_MAX_WIDTH : CLOSED_WIDTH,
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
                        expanded={settingsExpanded}
                        onChange={handleSettingsExpandedChange}
                        sx={{
                            backgroundColor: 'transparent',
                            '&:before': {display: 'none'},
                        }}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                            <Typography variant="subtitle2" sx={{fontWeight: 600}}>Settings</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{display: 'grid', gap: 1.5}}>
                                <ActiveEventSelector fullWidth/>
                                <ActiveServiceSelector fullWidth/>
                                <Box sx={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1}}>
                                    <TextField
                                        select
                                        size="small"
                                        label="Show from"
                                        value={plannerTimeRange.startHour}
                                        onChange={(event) => setPlannerTimeRange({...plannerTimeRange, startHour: Number(event.target.value)})}
                                    >
                                        {hours.map((hour) => <MenuItem key={hour} value={hour}>{String(hour).padStart(2, '0')}:00</MenuItem>)}
                                    </TextField>
                                    <TextField
                                        select
                                        size="small"
                                        label="Show until"
                                        value={plannerTimeRange.endHour}
                                        onChange={(event) => setPlannerTimeRange({...plannerTimeRange, endHour: Number(event.target.value)})}
                                    >
                                        {hours.map((hour) => <MenuItem key={hour} value={hour}>{hour === 0 ? '24:00' : `${String(hour).padStart(2, '0')}:00`}</MenuItem>)}
                                    </TextField>
                                </Box>
                                <EventDetails/>
                            </Box>
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
