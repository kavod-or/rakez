import React, {useState} from 'react'
import {Card, CardContent, Chip, Box, Stack, Typography, IconButton, TextField} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import type {EventItem} from '../api/client'

type Props = {
  event: EventItem
  isActive?: boolean
  onActivate?: (id: string) => void
  onSave?: (id: number, data: {name: string; start: string; end: string; description?: string}) => void
}

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

const toLocalDateTimeInput = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EventCard({event, isActive = false, onActivate, onSave}: Props) {
  const id = String(event.public_id || event.id)
  const handleActivate = () => onActivate?.(id)

  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(event.name)
  const [start, setStart] = useState(() => toLocalDateTimeInput(event.start))
  const [end, setEnd] = useState(() => toLocalDateTimeInput(event.end))
  const [description, setDescription] = useState(event.description || '')

  const enterEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setIsEditing(true)
  }

  const saveEdit = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e && ('stopPropagation' in e) && (e as any).stopPropagation()
    setIsEditing(false)
    // convert back to ISO strings using local interpretation
    const startIso = start ? new Date(start).toISOString() : ''
    const endIso = end ? new Date(end).toISOString() : ''
    onSave?.(event.id, {name: title, start: startIso, end: endIso, description})
  }

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) {
      if (e.key === 'Enter') {
        e.stopPropagation()
        saveEdit()
      }
    } else {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleActivate()
      }
    }
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={handleCardKeyDown}
      sx={(theme) => ({
        height: '100%',
        cursor: 'pointer',
        boxShadow: theme.shadows[1],
        border: isActive ? `2px solid ${theme.palette.primary.main}` : '1px solid transparent',
        transition: 'box-shadow 200ms, transform 120ms, border-color 200ms',
        '&:hover': { transform: 'translateY(-1px)' },
        position: 'relative',
      })}
    >
      <CardContent sx={{display: 'flex', flexDirection: 'column', height: '100%', gap: 1.5}}>
        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1}}>
          {isEditing ? (
            <TextField
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              size="small"
              variant="standard"
              onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.stopPropagation(); saveEdit(e) }
            }}
          />
          ) : (
          <Typography variant="h6" sx={{fontWeight: 600}}>{title}</Typography>
          )}

          <Box sx={{display: 'flex', alignItems: 'center'}}>
            {isActive && (
              <Chip label="Active" size="small" color="primary" sx={{fontWeight:700}} data-testid="active-chip" />
            )}
          </Box>
        </Box>

        <Stack spacing={0.5}>
          <Box>
            <Typography variant="caption" color="text.secondary">Timezone</Typography>
            <Box sx={{display: 'flex', gap: 1, alignItems: 'center'}}>
              <Typography variant="body2">{event.timezone}</Typography>
            </Box>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Starts</Typography>
            {isEditing ? (
              <TextField
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                size="small"
                variant="standard"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); saveEdit(e) } }}
                slotProps={{htmlInput: {'aria-label': 'Start datetime'}}}
              />
            ) : (
              <Typography variant="body2">{formatDateTime(event.start)}</Typography>
            )}
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Ends</Typography>
            {isEditing ? (
              <TextField
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                size="small"
                variant="standard"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); saveEdit(e) } }}
                slotProps={{htmlInput: {'aria-label': 'End datetime'}}}
              />
            ) : (
              <Typography variant="body2">{formatDateTime(event.end)}</Typography>
            )}
          </Box>
        </Stack>

        {isEditing ? (
          <TextField
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            size="small"
            variant="standard"
            fullWidth
            multiline
            minRows={2}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.stopPropagation(); saveEdit(e) } }}
            slotProps={{htmlInput: {'aria-label': 'Description'}}}
          />
        ) : (
          event.description && (
            <Typography variant="body2" color="text.secondary" sx={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {event.description}
            </Typography>
          )
        )}

        {/* edit/save icon bottom-right */}
        <IconButton
          aria-label={isEditing ? 'Save' : 'Edit'}
          size="small"
          onClick={isEditing ? saveEdit : enterEdit}
          sx={{position: 'absolute', right: 8, bottom: 8}}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {isEditing ? <SaveIcon /> : <EditIcon />}
        </IconButton>
      </CardContent>
    </Card>
  )
}
