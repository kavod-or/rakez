import {useEffect, useRef, useState} from 'react'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {Box, Button, Stack, TextField, Typography} from '@mui/material'
import {AppShell} from '../components/layout/AppShell'
import {Menu} from '../components/layout/Menu'
import {Panel} from '../components/layout/Panel'
import {ContentArea} from '../components/layout/ContentArea'
import {PanelDrawer} from '../components/layout/PanelDrawer'
import {createShift, deleteShift, getEvents, getServices, getShifts, patchShift, useActiveEventId, useActiveServiceId, usePlannerTimeRange} from '../api/client'
import type {EventItem, PlannerTimeRange, ServiceItem, ShiftItem} from '../api/client'
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

function ShiftDetailsDialog({shift, event, services, onClose}: {shift: ShiftItem | null; event: EventItem; services: ServiceItem[]; onClose: () => void}) {
    const queryClient = useQueryClient()
    const service = services.find((item) => item.id === shift?.service)
    const deleteMutation = useMutation({
        mutationFn: deleteShift,
        onSuccess: async () => { await queryClient.invalidateQueries({queryKey: ['shifts']}); onClose() },
    })
    return <DetailDialog open={shift !== null} onClose={onClose} title="Shift details" footer={<><Button color="error" onClick={() => shift && deleteMutation.mutate(shift.id)} disabled={deleteMutation.isPending}>Delete shift</Button><Button onClick={onClose}>Close</Button></>}>
        {shift && <Stack spacing={2}>
            <TextField label="Service" value={service?.name ?? 'Unknown service'} slotProps={{input: {readOnly: true}}} fullWidth />
            <TextField label="Start" value={new Intl.DateTimeFormat(undefined, {dateStyle: 'medium', timeStyle: 'short', timeZone: event.timezone}).format(new Date(shift.start))} slotProps={{input: {readOnly: true}}} fullWidth />
            <TextField label="End" value={new Intl.DateTimeFormat(undefined, {dateStyle: 'medium', timeStyle: 'short', timeZone: event.timezone}).format(new Date(shift.end))} slotProps={{input: {readOnly: true}}} fullWidth />
        </Stack>}
    </DetailDialog>
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

function ShiftTimetable({event, shifts, services, showServiceNames, timeRange, onSelect, onMove, onOpenShift}: {event: EventItem; shifts: ShiftItem[]; services: ServiceItem[]; showServiceNames: boolean; timeRange: PlannerTimeRange; onSelect: (range: TimeRange) => void; onMove: (shift: ShiftItem, start: number, end: number) => void; onOpenShift: (shift: ShiftItem) => void}) {
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
                {activeDragRange && dayStartFor(activeDragRange.start) === dayKey && <Box sx={{position: 'absolute', zIndex: 4, top: `${topPercent(activeDragRange.start)}%`, height: `${topPercent(activeDragRange.end) - topPercent(activeDragRange.start)}%`, left: 10, right: 10, minHeight: 2, px: 1, py: 0.75, boxSizing: 'border-box', bgcolor: 'secondary.main', color: 'secondary.contrastText', borderRadius: 1.25, boxShadow: 5, opacity: 0.9, pointerEvents: 'none', transform: 'scale(1.02)', transition: 'top 80ms ease, height 80ms ease'}}><Typography variant="caption" sx={{display: 'block', fontWeight: 700}}>{activeDragShift ? shiftLabel(activeDragShift) : 'Shift'} <Box component="span" sx={{fontWeight: 400, opacity: 0.8}}>{formatDuration(activeDragRange.start, activeDragRange.end)}</Box></Typography><Typography variant="caption">{formatTime(activeDragRange.start, event.timezone)} – {formatTime(activeDragRange.end, event.timezone)}</Typography></Box>}
                {layoutShifts(dayKey).filter(({shift}) => shift.id !== activeDragShiftId).map(({shift, start, end, lane, laneCount}) => <Box key={shift.id} onMouseMove={(e) => { const bounds = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.cursor = e.clientY - bounds.top < 8 || bounds.bottom - e.clientY < 8 ? 'ns-resize' : 'grab' }} onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); dragColumnRef.current = e.currentTarget.parentElement as HTMLDivElement; const bounds = e.currentTarget.getBoundingClientRect(); const edge = e.clientY - bounds.top < 8 ? 'start' : bounds.bottom - e.clientY < 8 ? 'end' : null; setDragStart(start); setDragCurrent(edge === 'end' ? end : start); setDragDayKey(dayKey); if (edge) setResizingShift({shift, edge}); else { shiftPointerDown.current = {x: e.clientX, y: e.clientY}; setMovingShift(shift) } }} sx={{position: 'absolute', zIndex: 3, top: `${topPercent(start)}%`, height: `${topPercent(end) - topPercent(start)}%`, left: `calc(${(lane / laneCount) * 100}% + 8px)`, width: `calc(${100 / laneCount}% - 16px)`, minHeight: 2, px: 1, py: 0.75, boxSizing: 'border-box', bgcolor: 'secondary.main', color: 'secondary.contrastText', borderRadius: 1.25, boxShadow: 2, overflow: 'hidden', cursor: 'grab'}}><Typography variant="caption" sx={{display: 'block', fontWeight: 700}}>{shiftLabel(shift)} <Box component="span" sx={{fontWeight: 400, opacity: 0.8}}>{formatDuration(start, end)}</Box></Typography><Typography variant="caption">{formatTime(start, event.timezone)} – {formatTime(end, event.timezone)}</Typography></Box>) }
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
    const toggleDrawer = () => setDrawerOpen((prev) => { const next = !prev; window.localStorage.setItem(panelDrawerStorageKey, next ? '1' : '0'); return next })
    return <AppShell maxWidth={false}><Menu/><ContentArea><Panel title={title} rightDrawer={<PanelDrawer open={drawerOpen} onToggle={toggleDrawer}/>} sx={{height: '100%'}}>
        {activeEvent ? <><ShiftTimetable event={activeEvent} shifts={shifts} services={services} showServiceNames={activeServiceId === null} timeRange={plannerTimeRange} onSelect={setSelection} onMove={(shift, start, end) => moveShiftMutation.mutate({shift, start, end})} onOpenShift={setSelectedShift}/><ShiftCreationDialog key={selection ? `${selection.start}-${selection.end}` : 'closed'} range={selection} event={activeEvent} services={services} activeServiceId={activeServiceId} onClose={() => setSelection(null)}/><ShiftDetailsDialog shift={selectedShift} event={activeEvent} services={services} onClose={() => setSelectedShift(null)}/></> : <Typography color="text.secondary">Select an event to plan shifts.</Typography>}
    </Panel></ContentArea></AppShell>
}
