import React from 'react'
import {Card, CardContent, Chip, Box, Stack, Typography} from '@mui/material'
import type {EventItem} from '../api/client'

type Props = {
  event: EventItem
  isActive?: boolean
  onActivate?: (id: string) => void
}

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

export default function EventCard({event, isActive = false, onActivate}: Props) {
  const id = event.public_id || event.id
  const handleActivate = () => onActivate?.(id)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleActivate()
    }
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      sx={(theme) => ({
        height: '100%',
        cursor: 'pointer',
        boxShadow: theme.shadows[1],
        border: isActive ? `2px solid ${theme.palette.primary.main}` : '1px solid transparent',
        transition: 'box-shadow 200ms, transform 120ms, border-color 200ms',
        '&:hover': { transform: 'translateY(-1px)' },
      })}
    >
      <CardContent sx={{display: 'flex', flexDirection: 'column', height: '100%', gap: 1.5}}>
        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1}}>
          <Typography variant="h6" sx={{fontWeight: 600}}>{event.name}</Typography>
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
            <Typography variant="body2">{formatDateTime(event.start)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Ends</Typography>
            <Typography variant="body2">{formatDateTime(event.end)}</Typography>
          </Box>
        </Stack>

        {event.description && (
          <Typography variant="body2" color="text.secondary" sx={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {event.description}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}
