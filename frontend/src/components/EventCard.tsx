import {Card, CardContent, Chip, Box, Stack, Typography, IconButton} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import type {EventItem} from '../api/client'

type EventCardProps = {
    event: EventItem
    isActive?: boolean
    onActivate?: (id: string) => void
    canEdit?: boolean
    onEdit?: (event: EventItem) => void
}

const formatDateTime = (value: string) => new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
}).format(new Date(value))

export default function EventCard({event, isActive = false, onActivate, onEdit, canEdit = false}: EventCardProps) {
    const id = String(event.public_id || event.id)
    const handleActivate = () => onActivate?.(id)
    const handleCardKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleActivate()
        }
    }

    return (
    <Card
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={handleCardKeyDown}
      sx={(theme) => ({
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        cursor: 'pointer',
        boxShadow: theme.shadows[1],
        border: isActive ? `2px solid ${theme.palette.primary.main}` : '1px solid transparent',
        transition: 'box-shadow 200ms, transform 120ms, border-color 200ms',
        '&:hover': {transform: 'translateY(-1px)'},
        position: 'relative',
      })}
    >
      <CardContent sx={{display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 0, boxSizing: 'border-box'}}>
        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1}}>
          <Typography variant="h6" sx={{fontWeight: 600, minWidth: 0, overflowWrap: 'anywhere'}}>{event.name}</Typography>
          <Box sx={{display: 'flex', alignItems: 'center'}}>
            {isActive && <Chip label="Active" size="small" color="primary" sx={{fontWeight: 700}} data-testid="active-chip"/>}
          </Box>
        </Box>
        <Stack spacing={0.5}>
          <Box sx={{minWidth: 0}}>
            <Typography variant="caption" color="text.secondary">Timezone</Typography>
            <Box sx={{display: 'flex', gap: 1, alignItems: 'center'}}>
              <Typography variant="body2" sx={{minWidth: 0, overflowWrap: 'anywhere'}}>{event.timezone}</Typography>
            </Box>
          </Box>
          <Box sx={{minWidth: 0}}>
            <Typography variant="caption" color="text.secondary">Starts</Typography>
            <Typography variant="body2" sx={{overflowWrap: 'anywhere'}}>{formatDateTime(event.start)}</Typography>
          </Box>
          <Box sx={{minWidth: 0}}>
            <Typography variant="caption" color="text.secondary">Ends</Typography>
            <Typography variant="body2" sx={{overflowWrap: 'anywhere'}}>{formatDateTime(event.end)}</Typography>
          </Box>
        </Stack>
        {event.description && (
          <Typography variant="body2" color="text.secondary" sx={{display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis'}}>{event.description}</Typography>
        )}
        {canEdit && (
          <IconButton aria-label="Edit event" size="small" onClick={(e) => {e.stopPropagation(); onEdit?.(event)}} sx={{position: 'absolute', right: 8, bottom: 8}} onMouseDown={(e) => e.stopPropagation()}>
            <EditIcon/>
          </IconButton>
        )}
      </CardContent>
    </Card>
    )
}
