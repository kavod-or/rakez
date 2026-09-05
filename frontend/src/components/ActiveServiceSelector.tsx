import {useQuery} from '@tanstack/react-query'
import {Box, Chip, FormControl, MenuItem, Select, Typography} from '@mui/material'
import {getServices, useActiveServiceId} from '../api/client'
import type {ServiceItem} from '../api/client'

export function ActiveServiceSelector({fullWidth = false}: {fullWidth?: boolean}) {
    const {data: services = [], isLoading} = useQuery<ServiceItem[]>({
        queryKey: ['services'],
        queryFn: getServices,
        retry: false,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    })
    const [activeServiceId, setActiveServiceId] = useActiveServiceId()
    const activeService = services.find((service) => service.id === activeServiceId)

    return (
        <FormControl size="small" fullWidth={fullWidth} sx={fullWidth ? undefined : {minWidth: 180, maxWidth: 320}}>
            <Select
                value={activeService?.id ?? ''}
                onChange={(event) => setActiveServiceId(event.target.value === '' ? null : Number(event.target.value))}
                displayEmpty
                disabled={isLoading || services.length === 0}
                aria-label="Select active service"
                sx={{
                    height: 36,
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: 2,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    '& .MuiSelect-select': {display: 'flex', alignItems: 'center', gap: 1, py: 0.5, px: 1.25},
                    '& fieldset': {borderColor: 'rgba(148, 163, 184, 0.25)'},
                    '&:hover fieldset': {borderColor: 'rgba(68, 167, 143, 0.7)'},
                    '&.Mui-focused fieldset': {borderColor: '#44A78F'},
                }}
                renderValue={(selected) => {
                    if (!selected || !activeService) {
                        return <Typography variant="body2" color="text.secondary">Select active service...</Typography>
                    }
                    return (
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden'}}>
                            <Chip label="Active" size="small" color="primary" sx={{height: 20, fontSize: '0.7rem', fontWeight: 700, px: 0.5, flexShrink: 0}}/>
                            <Typography variant="body2" sx={{fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                                {activeService.name}
                            </Typography>
                        </Box>
                    )
                }}
            >
                <MenuItem value="">
                    <Typography variant="body2" color="text.secondary"><em>None (No active service)</em></Typography>
                </MenuItem>
                {services.map((service) => (
                    <MenuItem key={service.id} value={service.id}>
                        <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1.5}}>
                            <Typography variant="body2" sx={{fontWeight: service.id === activeServiceId ? 600 : 400}}>
                                {service.name}
                            </Typography>
                            {service.id === activeServiceId && <Chip label="Active" size="small" color="primary" sx={{height: 18, fontSize: '0.65rem', fontWeight: 700}}/>}
                        </Box>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    )
}
