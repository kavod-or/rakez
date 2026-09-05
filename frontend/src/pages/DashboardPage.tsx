import {useEffect, useRef, useState} from 'react'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {Avatar, Box, Button, IconButton, MenuItem, Stack, TextField, Typography} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import {AppShell} from '../components/layout/AppShell'
import {Menu} from '../components/layout/Menu'
import {Panel} from '../components/layout/Panel'
import {ContentArea} from '../components/layout/ContentArea'
import {PanelDrawer} from '../components/layout/PanelDrawer'
import {createShift, createShiftAssignment, createShiftPosition, deleteShift, deleteShiftAssignment, deleteShiftPosition, getEvents, getPositions, getServices, getShiftAssignments, getShiftPositions, getShifts, getStaff, patchShift, patchShiftPosition, patchShiftPositionOrder, useActiveEventId, useActiveServiceId, usePlannerTimeRange} from '../api/client'
import type {EventItem, PlannerTimeRange, PositionItem, ServiceItem, ShiftAssignmentItem, ShiftItem, ShiftPositionItem, StaffItem} from '../api/client'

const fallbackServiceColor = '#3D7A6C'

function serviceColor(serviceId: number, services: ServiceItem[]) {
    return services.find((service) => service.id === serviceId)?.color ?? fallbackServiceColor
}

function serviceTextColor(background: string) {
    const match = /^#([0-9A-Fa-f]{6})$/.exec(background)
    if (!match) return '#E5EEFC'
    const value = Number.parseInt(match[1], 16)
    const red = (value >> 16) & 0xff
    const green = (value >> 8) & 0xff
    const blue = value & 0xff
    return (red * 299 + green * 587 + blue * 114) / 1000 > 150 ? '#07111F' : '#E5EEFC'
}
import {DetailDialog} from '../components/ui/DetailDialog'

const panelDrawerStorageKey = 'dashboard-panel-drawer-open'
const quarterHourMs = 15 * 60 * 1000
type TimeRange = {start: number; end: number}

function formatTime(value: number, timezone: string) {
    return new Intl.DateTimeFormat(undefined, {hour: '2-digit', minute: '2-digit', timeZone: timezone}).format(new Date(value))
}

function formatDuration(start: number, end: number) {
    const totalMinutes = Math.round((end - start) / 60000)
    return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`
}

function ShiftDetailsPanel({shift, event, services, positions, staff, shiftPositions, shiftAssignments, isDeleting, isAddingPosition, isChangingPositionSeats, isAssigningStaff, isRemovingStaff, isReorderingPositions, onClose, onDelete, onAddPosition, onChangePositionSeats, onAssignStaff, onRemoveStaff, onReorderPositions}: {shift: ShiftItem; event: EventItem; services: ServiceItem[]; positions: PositionItem[]; staff: StaffItem[]; shiftPositions: ShiftPositionItem[]; shiftAssignments: ShiftAssignmentItem[]; isDeleting: boolean; isAddingPosition: boolean; isChangingPositionSeats: boolean; isAssigningStaff: boolean; isRemovingStaff: boolean; isReorderingPositions: boolean; onClose: () => void; onDelete: (shift: ShiftItem) => void; onAddPosition: (positionId: number) => void; onChangePositionSeats: (shiftPosition: ShiftPositionItem, amount: number, assignmentId?: number) => void; onAssignStaff: (shiftPositionId: number, staffId: number) => void; onRemoveStaff: (assignmentId: number) => void; onReorderPositions: (sourceId: number, targetId: number) => void}) {
    const [positionId, setPositionId] = useState<number | ''>('')
    const [draggedPositionId, setDraggedPositionId] = useState<number | null>(null)
    const [draggedStaffId, setDraggedStaffId] = useState<number | null>(null)
    useEffect(() => {
        const handleStaffDragging = (event: Event) => setDraggedStaffId((event as CustomEvent<number | null>).detail)
        window.addEventListener('staff-dragging', handleStaffDragging)
        return () => window.removeEventListener('staff-dragging', handleStaffDragging)
    }, [])
    const service = services.find((item) => item.id === shift.service)
    const assignedShiftPositions = shiftPositions.filter((item) => item.shift === shift.id)
    const assignedPositionIds = assignedShiftPositions.map((item) => item.position)
    const availablePositions = positions.filter((position) => position.service === shift.service && !assignedPositionIds.includes(position.id))
    const assignmentsByPosition = (shiftPositionId: number) => shiftAssignments.filter((assignment) => assignment.shift_position === shiftPositionId)
    const staffMember = (staffId: number) => staff.find((item) => item.id === staffId)
    const staffName = (staffId: number) => { const member = staffMember(staffId); return member ? `${member.firstname} ${member.lastname}` : 'Unknown staff' }
    return <Box sx={{width: 375, flexShrink: 0, ml: 1.5, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper', alignSelf: 'stretch', minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
        <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5}}><Typography variant="subtitle2" sx={{fontWeight: 700}}>Shift details</Typography><IconButton aria-label="Close shift details" size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton></Box>
        <Stack spacing={1.25} sx={{flexGrow: 1, minHeight: 0}}>
            <Typography variant="body2" sx={{fontWeight: 600}}>{service?.name ?? 'Unknown service'}</Typography><Typography variant="caption" color="text.secondary">{new Intl.DateTimeFormat(undefined, {dateStyle: 'short', timeStyle: 'short', timeZone: event.timezone}).format(new Date(shift.start))} – {new Intl.DateTimeFormat(undefined, {dateStyle: 'short', timeStyle: 'short', timeZone: event.timezone}).format(new Date(shift.end))} · {formatDuration(new Date(shift.start).getTime(), new Date(shift.end).getTime())}</Typography>
            <Box sx={{pt: 1, flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column'}}>
                <Typography variant="subtitle2" sx={{fontWeight: 700, mb: 1}}>Positions</Typography>
                {availablePositions.length > 0 && <Stack direction="row" spacing={1} sx={{mb: assignedShiftPositions.length > 0 ? 1 : 0}}><TextField select size="small" label="Add position" value={positionId} onChange={(event) => setPositionId(event.target.value === '' ? '' : Number(event.target.value))} fullWidth><MenuItem value="">Select position</MenuItem>{availablePositions.map((position) => <MenuItem key={position.id} value={position.id}>{position.name}</MenuItem>)}</TextField><Button variant="outlined" size="small" disabled={positionId === '' || isAddingPosition} onClick={() => { if (positionId !== '') { onAddPosition(positionId); setPositionId('') } }}>Add</Button></Stack>}
                {assignedShiftPositions.length > 0 && <Stack spacing={1} sx={{flexGrow: 1, minHeight: 0, overflowY: 'auto'}}>{assignedShiftPositions.map((shiftPosition) => { const assignments = assignmentsByPosition(shiftPosition.id); return <Box key={shiftPosition.id} draggable={!isReorderingPositions} onDragStart={(event) => { if (event.target !== event.currentTarget) return; setDraggedPositionId(shiftPosition.id); event.dataTransfer.setData('application/x-rakez-shift-position-id', String(shiftPosition.id)); event.dataTransfer.effectAllowed = 'move' }} onDragEnd={() => setDraggedPositionId(null)} onDragOver={(event) => { if (event.dataTransfer.types.includes('application/x-rakez-shift-position-id')) event.preventDefault() }} onDrop={(event) => { event.preventDefault(); const sourceId = Number(event.dataTransfer.getData('application/x-rakez-shift-position-id')); if (!isReorderingPositions && Number.isInteger(sourceId) && sourceId !== shiftPosition.id) onReorderPositions(sourceId, shiftPosition.id) }} sx={{border: '1px solid', borderColor: draggedPositionId !== null && draggedPositionId !== shiftPosition.id ? 'primary.main' : 'divider', borderRadius: 1.5, p: 1, cursor: isReorderingPositions ? 'progress' : 'grab', opacity: draggedPositionId === shiftPosition.id ? 0.55 : 1, transition: 'border-color 120ms ease, opacity 120ms ease'}}><Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75}}><Stack direction="row" spacing={0.5} sx={{alignItems: 'center', minWidth: 0}}><Box aria-label="Drag position to reorder" sx={{color: 'text.secondary', fontSize: '1.1rem', lineHeight: 1, cursor: 'grab'}}>⠿</Box><Typography variant="body2" sx={{fontWeight: 600}}>{positions.find((position) => position.id === shiftPosition.position)?.name ?? 'Unknown position'}</Typography></Stack><Stack direction="row" spacing={0.25}><IconButton aria-label="Remove seat" size="small" disabled={isChangingPositionSeats} onClick={() => onChangePositionSeats(shiftPosition, shiftPosition.amount - 1, assignments.length === shiftPosition.amount ? assignments.at(-1)?.id : undefined)}><RemoveIcon fontSize="small" /></IconButton><IconButton aria-label="Add seat" size="small" disabled={isChangingPositionSeats} onClick={() => onChangePositionSeats(shiftPosition, shiftPosition.amount + 1)}><AddIcon fontSize="small" /></IconButton></Stack></Box><Box sx={{display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 0.5}}>{Array.from({length: shiftPosition.amount}, (_, index) => { const assignment = assignments[index]; const member = assignment ? staffMember(assignment.staff) : null; return <Box key={assignment?.id ?? index} aria-label={assignment ? staffName(assignment.staff) : 'Drop staff here'} draggable={Boolean(assignment)} onDragStart={(event) => { if (assignment) { event.dataTransfer.setData('application/x-rakez-shift-assignment-id', String(assignment.id)); event.dataTransfer.effectAllowed = 'move' } }} onDragOver={(event) => { if (!assignment) event.preventDefault() }} onDrop={(event) => { event.preventDefault(); const staffId = Number(event.dataTransfer.getData('application/x-rakez-staff-id')); if (!assignment && !isAssigningStaff && staff.some((member) => member.id === staffId)) onAssignStaff(shiftPosition.id, staffId) }} sx={{width: '100%', minHeight: 50, px: 0.75, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', textAlign: 'left', border: assignment ? '1px solid rgba(148, 163, 184, 0.16)' : '1px dashed', borderColor: assignment ? 'rgba(148, 163, 184, 0.16)' : draggedStaffId !== null ? 'primary.main' : 'divider', borderRadius: 0.75, bgcolor: assignment ? 'rgba(15, 23, 42, 0.45)' : draggedStaffId !== null ? 'action.selected' : 'action.hover', color: 'text.secondary', fontSize: '0.7rem', cursor: assignment ? 'default' : 'copy', transition: 'border-color 120ms ease, background-color 120ms ease'}}>{assignment ? <Stack direction="row" spacing={0.75} sx={{alignItems: 'center', minWidth: 0}}><Avatar sx={{width: 28, height: 28, fontSize: '0.7rem', backgroundColor: 'primary.main', color: 'primary.contrastText', fontWeight: 700}}>{member ? `${member.firstname.charAt(0)}${member.lastname.charAt(0)}`.toUpperCase() : '?'}</Avatar><Typography variant="caption" sx={{fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{staffName(assignment.staff)}</Typography></Stack> : 'Drop staff'}</Box> })}</Box></Box>})}</Stack>}
            </Box>
        </Stack>
        <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto', pt: 1}}><Button color="error" size="small" onClick={() => onDelete(shift)} disabled={isDeleting}>Delete shift</Button><Box aria-label="Remove staff assignment" onDragOver={(event) => { if (event.dataTransfer.types.includes('application/x-rakez-shift-assignment-id')) event.preventDefault() }} onDrop={(event) => { event.preventDefault(); const assignmentId = Number(event.dataTransfer.getData('application/x-rakez-shift-assignment-id')); if (!isRemovingStaff && Number.isInteger(assignmentId) && assignmentId > 0) onRemoveStaff(assignmentId) }} sx={{width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed', borderColor: 'error.main', borderRadius: 1, color: 'error.main', cursor: 'copy'}}><DeleteOutlineIcon fontSize="small" /></Box></Box>
    </Box>
}

function ShiftCreationDialog({range, event, services, activeServiceId, onClose}: {range: TimeRange | null; event: EventItem; services: ServiceItem[]; activeServiceId: number | null; onClose: () => void}) {
    const queryClient = useQueryClient()
    const [error, setError] = useState<string | null>(null)
    const service = services.find((item) => item.id === activeServiceId)
    const createMutation = useMutation({
        mutationFn: createShift,
        onSuccess: async () => { await queryClient.invalidateQueries({queryKey: ['shifts']}); onClose() },
        onError: (err) => setError(err instanceof Error ? err.message : 'Failed to create shift.'),
    })
    const create = () => {
        if (!range || activeServiceId === null) { setError('Select an active service before creating a shift.'); return }
        createMutation.mutate({service: activeServiceId, event: event.id, start: new Date(range.start).toISOString(), end: new Date(range.end).toISOString()})
    }
    return <DetailDialog open={range !== null} onClose={onClose} title="Create shift" footer={<><Button onClick={onClose}>Cancel</Button><Button variant="contained" onClick={create} disabled={createMutation.isPending}>Create shift</Button></>}>
        {range && <Stack spacing={2}>
            <TextField label="Start" value={formatTime(range.start, event.timezone)} slotProps={{input: {readOnly: true}}} fullWidth />
            <TextField label="End" value={formatTime(range.end, event.timezone)} slotProps={{input: {readOnly: true}}} fullWidth />
            <TextField label="Service" value={service?.name ?? 'No active service'} slotProps={{input: {readOnly: true}}} fullWidth />
            {error && <Typography color="error" variant="body2">{error}</Typography>}
        </Stack>}
    </DetailDialog>
}

function ShiftTimetable({event, shifts, services, showServiceNames, selectedShiftId, timeRange, onSelect, onMove, onOpenShift}: {event: EventItem; shifts: ShiftItem[]; services: ServiceItem[]; showServiceNames: boolean; selectedShiftId: number | null; timeRange: PlannerTimeRange; onSelect: (range: TimeRange) => void; onMove: (shift: ShiftItem, start: number, end: number) => void; onOpenShift: (shift: ShiftItem) => void}) {
    const dragColumnRef = useRef<HTMLDivElement>(null)
    const shiftPointerDown = useRef<{x: number; y: number} | null>(null)
    const [dragStart, setDragStart] = useState<number | null>(null)
    const [dragCurrent, setDragCurrent] = useState<number | null>(null)
    const [dragDayKey, setDragDayKey] = useState<string | null>(null)
    const [movingShift, setMovingShift] = useState<ShiftItem | null>(null)
    const [resizingShift, setResizingShift] = useState<{shift: ShiftItem; edge: 'start' | 'end'} | null>(null)
    const eventStart = new Date(event.start).getTime()
    const eventEnd = new Date(event.end).getTime()
    const shiftLabel = (shift: ShiftItem) => showServiceNames ? services.find((service) => service.id === shift.service)?.name ?? 'Unknown service' : 'Shift'
    const datePartsFormatter = new Intl.DateTimeFormat('en-GB', {timeZone: event.timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'})
    const partsFor = (value: number) => Object.fromEntries(datePartsFormatter.formatToParts(new Date(value)).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]))
    const dateKeyFor = (value: number) => {
        const parts = partsFor(value)
        return `${parts.year}-${parts.month}-${parts.day}`
    }
    const timestampFor = (dateKey: string, minutes = 0) => {
        const [year, month, day] = dateKey.split('-').map(Number)
        const target = Date.UTC(year, month - 1, day, Math.floor(minutes / 60), minutes % 60)
        let timestamp = target
        for (let attempt = 0; attempt < 3; attempt += 1) {
            const parts = partsFor(timestamp)
            const observed = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute))
            timestamp += target - observed
        }
        return timestamp
    }
    const eventDate = dateKeyFor(eventStart)
    const endDate = dateKeyFor(eventEnd - 1)
    const dayKeys: string[] = []
    for (let cursor = new Date(`${eventDate}T00:00:00Z`); cursor <= new Date(`${endDate}T00:00:00Z`); cursor.setUTCDate(cursor.getUTCDate() + 1)) dayKeys.push(cursor.toISOString().slice(0, 10))
    const dayFormatter = new Intl.DateTimeFormat(undefined, {timeZone: event.timezone, weekday: 'short', month: 'short', day: 'numeric'})
    const minutesOfDay = (value: number) => {
        const parts = partsFor(value)
        return Number(parts.hour) * 60 + Number(parts.minute)
    }
    const dayStartFor = (value: number) => dateKeyFor(value)
    const selectionFrom = (first: number, second: number): TimeRange | null => {
        const start = Math.max(eventStart, Math.floor(Math.min(first, second) / quarterHourMs) * quarterHourMs)
        const end = Math.min(eventEnd, Math.ceil(Math.max(first, second) / quarterHourMs) * quarterHourMs)
        return end > start ? {start, end} : null
    }
    const visibleStartMinute = timeRange.startHour * 60
    const visibleDurationMinutes = ((timeRange.endHour - timeRange.startHour + 24) % 24 || 24) * 60
    const visibleEndMinute = visibleStartMinute + visibleDurationMinutes
    const displayedMinute = (value: number) => {
        const minute = minutesOfDay(value)
        return minute < visibleStartMinute ? minute + 24 * 60 : minute
    }
    const isVisible = (value: number) => displayedMinute(value) >= visibleStartMinute && displayedMinute(value) <= visibleEndMinute
    const timeFromPointer = (clientY: number, dayKey: string, column?: HTMLDivElement) => {
        const rect = (column ?? dragColumnRef.current)?.getBoundingClientRect()
        const minute = rect ? Math.max(visibleStartMinute, Math.min(visibleEndMinute, visibleStartMinute + ((clientY - rect.top) / rect.height) * visibleDurationMinutes)) : visibleStartMinute
        return timestampFor(dayKey, minute)
    }
    useEffect(() => {
        if (dragStart === null) return
        const handleMouseUp = (mouseEvent: MouseEvent) => {
            if (resizingShift && dragDayKey) {
                const target = timeFromPointer(mouseEvent.clientY, dragDayKey)
                const originalStart = new Date(resizingShift.shift.start).getTime()
                const originalEnd = new Date(resizingShift.shift.end).getTime()
                const start = resizingShift.edge === 'start' ? Math.max(eventStart, Math.min(originalEnd - quarterHourMs, Math.floor(target / quarterHourMs) * quarterHourMs)) : originalStart
                const end = resizingShift.edge === 'end' ? Math.min(eventEnd, Math.max(originalStart + quarterHourMs, Math.ceil(target / quarterHourMs) * quarterHourMs)) : originalEnd
                onMove(resizingShift.shift, start, end)
            } else if (movingShift && dragDayKey) {
                const didDrag = shiftPointerDown.current !== null && (Math.abs(mouseEvent.clientX - shiftPointerDown.current.x) > 3 || Math.abs(mouseEvent.clientY - shiftPointerDown.current.y) > 3)
                if (didDrag) {
                    const targetColumn = document.elementFromPoint(mouseEvent.clientX, mouseEvent.clientY)?.closest<HTMLElement>('[data-day-key]')
                    const targetDayKey = targetColumn?.dataset.dayKey ?? dragDayKey
                    const duration = new Date(movingShift.end).getTime() - new Date(movingShift.start).getTime()
                    const target = timeFromPointer(mouseEvent.clientY, targetDayKey, targetColumn as HTMLDivElement | undefined)
                    const start = Math.max(eventStart, Math.min(eventEnd - duration, Math.floor(target / quarterHourMs) * quarterHourMs))
                    onMove(movingShift, start, start + duration)
                } else onOpenShift(movingShift)
            } else {
                const selection = dragDayKey ? selectionFrom(dragStart, timeFromPointer(mouseEvent.clientY, dragDayKey)) : null
                if (selection) onSelect(selection)
            }
            setDragStart(null); setDragCurrent(null); setDragDayKey(null); setMovingShift(null); setResizingShift(null); dragColumnRef.current = null; shiftPointerDown.current = null
        }
        window.addEventListener('mouseup', handleMouseUp)
        return () => window.removeEventListener('mouseup', handleMouseUp)
    }, [dragDayKey, dragStart, eventEnd, eventStart, onSelect])
    useEffect(() => {
        if (!movingShift && !resizingShift) return
        const handleMouseMove = (mouseEvent: MouseEvent) => {
            const targetColumn = document.elementFromPoint(mouseEvent.clientX, mouseEvent.clientY)?.closest<HTMLElement>('[data-day-key]')
            const targetDayKey = targetColumn?.dataset.dayKey
            if (!targetDayKey) return
            setDragDayKey(targetDayKey)
            setDragCurrent(timeFromPointer(mouseEvent.clientY, targetDayKey, targetColumn as HTMLDivElement))
        }
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [movingShift])
    const preview = dragStart === null || dragCurrent === null ? null : selectionFrom(dragStart, dragCurrent)
    const gridSlots = visibleDurationMinutes / 15
    const height = gridSlots * 16
    const gridSize = 100 / gridSlots
    const topPercent = (value: number) => Math.max(0, Math.min(100, ((displayedMinute(value) - visibleStartMinute) / visibleDurationMinutes) * 100))
    const movingRange = movingShift && dragCurrent !== null ? (() => {
        const duration = new Date(movingShift.end).getTime() - new Date(movingShift.start).getTime()
        const start = Math.max(eventStart, Math.min(eventEnd - duration, Math.floor(dragCurrent / quarterHourMs) * quarterHourMs))
        return {start, end: start + duration}
    })() : null
    const resizingRange = resizingShift && dragCurrent !== null ? (() => {
        const originalStart = new Date(resizingShift.shift.start).getTime()
        const originalEnd = new Date(resizingShift.shift.end).getTime()
        return resizingShift.edge === 'start'
            ? {start: Math.max(eventStart, Math.min(originalEnd - quarterHourMs, Math.floor(dragCurrent / quarterHourMs) * quarterHourMs)), end: originalEnd}
            : {start: originalStart, end: Math.min(eventEnd, Math.max(originalStart + quarterHourMs, Math.ceil(dragCurrent / quarterHourMs) * quarterHourMs))}
    })() : null
    const activeDragRange = movingRange ?? resizingRange
    const activeDragShift = movingShift ?? resizingShift?.shift
    const activeDragShiftId = activeDragShift?.id
    const layoutShifts = (dayKey: string) => {
        const dayShifts = shifts.map((shift) => ({shift, start: Math.max(eventStart, new Date(shift.start).getTime()), end: Math.min(eventEnd, new Date(shift.end).getTime())}))
            .filter(({start, end}) => end > start && dayStartFor(start) === dayKey && isVisible(start) && isVisible(end - 1))
            .sort((a, b) => a.start - b.start || a.end - b.end)
        const laidOut: Array<typeof dayShifts[number] & {lane: number; laneCount: number}> = []
        let group: Array<typeof dayShifts[number] & {lane: number; laneCount: number}> = []
        let groupEnd = -Infinity
        const finishGroup = () => {
            const laneEnds: number[] = []
            group.forEach((item) => {
                const lane = laneEnds.findIndex((end) => end <= item.start)
                item.lane = lane === -1 ? laneEnds.length : lane
                laneEnds[item.lane] = item.end
            })
            group.forEach((item) => { item.laneCount = laneEnds.length })
            laidOut.push(...group)
            group = []
        }
        for (const item of dayShifts) {
            if (group.length && item.start >= groupEnd) finishGroup()
            group.push({...item, lane: 0, laneCount: 1})
            groupEnd = Math.max(groupEnd, item.end)
        }
        if (group.length) finishGroup()
        return laidOut
    }
    return <Box sx={{flexGrow: 1, minHeight: 0, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'rgba(15, 23, 42, 0.2)'}}>
        <Box sx={{display: 'grid', gridTemplateColumns: `64px repeat(${dayKeys.length}, minmax(220px, 1fr))`, minWidth: Math.max(560, dayKeys.length * 220 + 64)}}>
            <Box sx={{position: 'sticky', top: 0, left: 0, zIndex: 4, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider'}} />
            {dayKeys.map((dayKey) => <Box key={dayKey} sx={{position: 'sticky', top: 0, zIndex: 3, py: 0.5, textAlign: 'center', bgcolor: 'background.paper', borderBottom: 1, borderLeft: 1, borderColor: 'divider'}}><Typography variant="caption" sx={{fontWeight: 700}}>{dayFormatter.format(new Date(timestampFor(dayKey)))}</Typography></Box>)}
            <Box sx={{height, position: 'relative', mr: 1, bgcolor: 'background.paper'}}>{Array.from({length: visibleDurationMinutes / 60 + 1}, (_, index) => { const hour = (timeRange.startHour + index) % 24; return <Typography key={index} variant="caption" color="text.secondary" sx={{position: 'absolute', top: `${(index * 60 / visibleDurationMinutes) * 100}%`, right: 8, transform: index === 0 ? 'none' : 'translateY(-50%)', fontVariantNumeric: 'tabular-nums'}}>{String(hour).padStart(2, '0')}:00</Typography> })}</Box>
            {dayKeys.map((dayKey) => {
                const availableStart = dayKey === eventDate ? topPercent(Math.max(eventStart, timestampFor(dayKey, visibleStartMinute))) : 0
                const availableEnd = dayKey === endDate ? topPercent(Math.min(eventEnd, timestampFor(dayKey, visibleEndMinute))) : 100
                return <Box key={dayKey} data-day-key={dayKey} role="presentation" onMouseDown={(e) => { e.preventDefault(); dragColumnRef.current = e.currentTarget; const time = timeFromPointer(e.clientY, dayKey, e.currentTarget); setDragStart(time); setDragCurrent(time); setDragDayKey(dayKey) }} onMouseMove={(e) => { if (dragStart !== null && dragDayKey === dayKey) setDragCurrent(timeFromPointer(e.clientY, dayKey, e.currentTarget)) }} sx={{height, position: 'relative', overflow: 'hidden', borderLeft: 1, borderColor: 'divider', cursor: 'crosshair', userSelect: 'none', backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent calc(${gridSize}% - 1px), rgba(148, 163, 184, 0.22) calc(${gridSize}% - 1px), rgba(148, 163, 184, 0.22) ${gridSize}%)`}}>
                {availableStart > 0 && <Box onMouseDown={(e) => e.stopPropagation()} sx={{position: 'absolute', top: 0, height: `${availableStart}%`, left: 0, right: 0, zIndex: 2, bgcolor: 'action.disabledBackground', opacity: 0.8, cursor: 'not-allowed'}} />}
                {availableEnd < 100 && <Box onMouseDown={(e) => e.stopPropagation()} sx={{position: 'absolute', top: `${availableEnd}%`, bottom: 0, left: 0, right: 0, zIndex: 2, bgcolor: 'action.disabledBackground', opacity: 0.8, cursor: 'not-allowed'}} />}
                {preview && dayStartFor(preview.start) === dayKey && <Box sx={{position: 'absolute', top: `${topPercent(preview.start)}%`, height: `${topPercent(preview.end) - topPercent(preview.start)}%`, left: 0, right: 0, zIndex: 1, bgcolor: 'primary.main', opacity: 0.24, borderTop: 2, borderBottom: 2, borderColor: 'primary.main', pointerEvents: 'none'}} />}
                {activeDragRange && dayStartFor(activeDragRange.start) === dayKey && <Box sx={{position: 'absolute', zIndex: 4, top: `${topPercent(activeDragRange.start)}%`, height: `${topPercent(activeDragRange.end) - topPercent(activeDragRange.start)}%`, left: 10, right: 10, minHeight: 2, px: 1, py: 0.75, boxSizing: 'border-box', bgcolor: activeDragShift ? serviceColor(activeDragShift.service, services) : 'secondary.main', color: activeDragShift ? serviceTextColor(serviceColor(activeDragShift.service, services)) : 'secondary.contrastText', borderRadius: 1.25, boxShadow: 5, opacity: 0.9, pointerEvents: 'none', transform: 'scale(1.02)', transition: 'top 80ms ease, height 80ms ease'}}><Typography variant="caption" sx={{display: 'block', fontWeight: 700}}>{activeDragShift ? shiftLabel(activeDragShift) : 'Shift'} <Box component="span" sx={{fontWeight: 400, opacity: 0.8}}>{formatDuration(activeDragRange.start, activeDragRange.end)}</Box></Typography><Typography variant="caption">{formatTime(activeDragRange.start, event.timezone)} – {formatTime(activeDragRange.end, event.timezone)}</Typography></Box>}
                {layoutShifts(dayKey).filter(({shift}) => shift.id !== activeDragShiftId).map(({shift, start, end, lane, laneCount}) => { const background = serviceColor(shift.service, services); return <Box key={shift.id} onMouseMove={(e) => { const bounds = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.cursor = e.clientY - bounds.top < 8 || bounds.bottom - e.clientY < 8 ? 'ns-resize' : 'grab' }} onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); dragColumnRef.current = e.currentTarget.parentElement as HTMLDivElement; const bounds = e.currentTarget.getBoundingClientRect(); const edge = e.clientY - bounds.top < 8 ? 'start' : bounds.bottom - e.clientY < 8 ? 'end' : null; setDragStart(start); setDragCurrent(edge === 'end' ? end : start); setDragDayKey(dayKey); if (edge) setResizingShift({shift, edge}); else { shiftPointerDown.current = {x: e.clientX, y: e.clientY}; setMovingShift(shift) } }} sx={{position: 'absolute', zIndex: 3, top: `${topPercent(start)}%`, height: `${topPercent(end) - topPercent(start)}%`, left: `calc(${(lane / laneCount) * 100}% + 8px)`, width: `calc(${100 / laneCount}% - 16px)`, minHeight: 2, px: 1, py: 0.75, boxSizing: 'border-box', bgcolor: background, color: serviceTextColor(background), borderRadius: 1.25, boxShadow: 2, overflow: 'hidden', cursor: 'grab', opacity: selectedShiftId !== null && selectedShiftId !== shift.id ? 0.38 : 1, transition: 'opacity 150ms ease'}}><Typography variant="caption" sx={{display: 'block', fontWeight: 700}}>{shiftLabel(shift)} <Box component="span" sx={{fontWeight: 400, opacity: 0.8}}>{formatDuration(start, end)}</Box></Typography><Typography variant="caption">{formatTime(start, event.timezone)} – {formatTime(end, event.timezone)}</Typography></Box> }) }
            </Box>
            })}
        </Box>
    </Box>
}

export function DashboardPage() {
    const [drawerOpen, setDrawerOpen] = useState(() => typeof window !== 'undefined' && window.localStorage.getItem(panelDrawerStorageKey) === '1')
    const [selection, setSelection] = useState<TimeRange | null>(null)
    const [selectedShift, setSelectedShift] = useState<ShiftItem | null>(null)
    const {data: events = []} = useQuery<EventItem[]>({queryKey: ['events'], queryFn: getEvents, retry: false, staleTime: 1000 * 60 * 5, refetchOnWindowFocus: false})
    const {data: services = []} = useQuery<ServiceItem[]>({queryKey: ['services'], queryFn: getServices, retry: false, staleTime: 1000 * 60 * 5, refetchOnWindowFocus: false})
    const {data: positions = []} = useQuery<PositionItem[]>({queryKey: ['positions'], queryFn: getPositions, retry: false})
    const {data: staff = []} = useQuery<StaffItem[]>({queryKey: ['staff'], queryFn: getStaff, retry: false})
    const {data: shiftPositions = []} = useQuery<ShiftPositionItem[]>({queryKey: ['shift-positions'], queryFn: getShiftPositions, retry: false})
    const {data: shiftAssignments = []} = useQuery<ShiftAssignmentItem[]>({queryKey: ['shift-assignments'], queryFn: getShiftAssignments, retry: false})
    const {data: allShifts = []} = useQuery<ShiftItem[]>({queryKey: ['shifts'], queryFn: getShifts, retry: false})
    const [activeEventId] = useActiveEventId(); const [activeServiceId] = useActiveServiceId(); const [plannerTimeRange] = usePlannerTimeRange()
    const activeEvent = events.find((event) => String(event.public_id || event.id) === activeEventId)
    const activeService = services.find((service) => service.id === activeServiceId)
    const title = [activeEvent?.name, activeService?.name].filter(Boolean).join(' · ') || 'Dashboard'
    const shifts = activeEvent ? allShifts.filter((shift) => shift.event === activeEvent.id && (activeServiceId === null || shift.service === activeServiceId)) : []
    const queryClient = useQueryClient()
    const moveShiftMutation = useMutation({
        mutationFn: ({shift, start, end}: {shift: ShiftItem; start: number; end: number}) => patchShift(shift.id, {start: new Date(start).toISOString(), end: new Date(end).toISOString()}),
        onSuccess: () => queryClient.invalidateQueries({queryKey: ['shifts']}),
    })
    const deleteShiftMutation = useMutation({
        mutationFn: deleteShift,
        onSuccess: async () => { await queryClient.invalidateQueries({queryKey: ['shifts']}); setSelectedShift(null) },
    })
    const addShiftPositionMutation = useMutation({
        mutationFn: ({shiftId, positionId}: {shiftId: number; positionId: number}) => createShiftPosition(shiftId, positionId),
        onSuccess: () => queryClient.invalidateQueries({queryKey: ['shift-positions']}),
    })
    const changeShiftPositionSeatsMutation = useMutation({
        mutationFn: async ({shiftPosition, amount, assignmentId}: {shiftPosition: ShiftPositionItem; amount: number; assignmentId?: number}) => { if (assignmentId) await deleteShiftAssignment(assignmentId); if (amount === 0) await deleteShiftPosition(shiftPosition.id); else await patchShiftPosition(shiftPosition.id, amount) },
        onSuccess: async () => { await queryClient.invalidateQueries({queryKey: ['shift-positions']}); await queryClient.invalidateQueries({queryKey: ['shift-assignments']}) },
    })
    const assignStaffMutation = useMutation({
        mutationFn: ({shiftPositionId, staffId}: {shiftPositionId: number; staffId: number}) => createShiftAssignment(shiftPositionId, staffId),
        onSuccess: () => queryClient.invalidateQueries({queryKey: ['shift-assignments']}),
    })
    const removeStaffMutation = useMutation({
        mutationFn: deleteShiftAssignment,
        onSuccess: () => queryClient.invalidateQueries({queryKey: ['shift-assignments']}),
    })
    const reorderPositionsMutation = useMutation({
        mutationFn: async ({sourceId, targetId}: {sourceId: number; targetId: number}) => {
            if (!selectedShift) return
            const ordered = shiftPositions.filter((item) => item.shift === selectedShift.id).sort((left, right) => left.sort_order - right.sort_order)
            const sourceIndex = ordered.findIndex((item) => item.id === sourceId)
            const targetIndex = ordered.findIndex((item) => item.id === targetId)
            if (sourceIndex < 0 || targetIndex < 0) return
            const [source] = ordered.splice(sourceIndex, 1)
            ordered.splice(targetIndex, 0, source)
            await Promise.all(ordered.map((item, index) => item.sort_order === index + 1 ? Promise.resolve() : patchShiftPositionOrder(item.id, index + 1)))
        },
        onSuccess: () => queryClient.invalidateQueries({queryKey: ['shift-positions']}),
    })
    const toggleDrawer = () => setDrawerOpen((prev) => { const next = !prev; window.localStorage.setItem(panelDrawerStorageKey, next ? '1' : '0'); return next })
    return <AppShell maxWidth={false}><Menu/><ContentArea><Panel title={title} rightDrawer={<PanelDrawer open={drawerOpen} onToggle={toggleDrawer}/>} sx={{height: '100%'}}>
        {activeEvent ? <><Box sx={{display: 'flex', flexGrow: 1, minHeight: 0, minWidth: 0}}><ShiftTimetable event={activeEvent} shifts={shifts} services={services} showServiceNames={activeServiceId === null} selectedShiftId={selectedShift?.id ?? null} timeRange={plannerTimeRange} onSelect={setSelection} onMove={(shift, start, end) => moveShiftMutation.mutate({shift, start, end})} onOpenShift={setSelectedShift}/>{selectedShift && <ShiftDetailsPanel key={selectedShift.id} shift={selectedShift} event={activeEvent} services={services} positions={positions} staff={staff} shiftPositions={shiftPositions} shiftAssignments={shiftAssignments} isDeleting={deleteShiftMutation.isPending} isAddingPosition={addShiftPositionMutation.isPending} isChangingPositionSeats={changeShiftPositionSeatsMutation.isPending} isAssigningStaff={assignStaffMutation.isPending} isRemovingStaff={removeStaffMutation.isPending} isReorderingPositions={reorderPositionsMutation.isPending} onClose={() => setSelectedShift(null)} onDelete={(shift) => deleteShiftMutation.mutate(shift.id)} onAddPosition={(positionId) => addShiftPositionMutation.mutate({shiftId: selectedShift.id, positionId})} onChangePositionSeats={(shiftPosition, amount, assignmentId) => changeShiftPositionSeatsMutation.mutate({shiftPosition, amount, assignmentId})} onAssignStaff={(shiftPositionId, staffId) => assignStaffMutation.mutate({shiftPositionId, staffId})} onRemoveStaff={(assignmentId) => removeStaffMutation.mutate(assignmentId)} onReorderPositions={(sourceId, targetId) => reorderPositionsMutation.mutate({sourceId, targetId})}/>}</Box><ShiftCreationDialog key={selection ? `${selection.start}-${selection.end}` : 'closed'} range={selection} event={activeEvent} services={services} activeServiceId={activeServiceId} onClose={() => setSelection(null)}/></> : <Typography color="text.secondary">Select an event to plan shifts.</Typography>}
    </Panel></ContentArea></AppShell>
}
