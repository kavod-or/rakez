import {z} from 'zod'
import {Controller, useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {Navigate, useLocation, useNavigate} from 'react-router-dom'
import {Box, Button, Link, TextField} from '@mui/material'

import {getCurrentUser, login} from '../api/client'
import {AppShell} from '../components/layout/AppShell'
import {Panel} from '../components/layout/Panel'
import {ApiErrorSnackbar} from '../components/ui/ApiErrorSnackbar'

import heromark from '../assets/rakez_heromark.svg'
import wordmark from '../assets/wordmark.svg'
import logo from '../assets/rakez.svg'
import GitHubIcon from "@mui/icons-material/GitHub";

const loginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>
type RedirectLocationState = {
    from?: {
        pathname: string
        search?: string
        hash?: string
    }
}

export function LoginPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const queryClient = useQueryClient()
    const {
        control,
        handleSubmit,
        formState: {errors},
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    })

    const from = (location.state as RedirectLocationState | undefined)?.from
    const redirectTo =
        from && from.pathname !== '/login'
            ? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`
            : '/dashboard'

    const loginMutation = useMutation({
        mutationFn: async (values: LoginFormValues) => login(values.username, values.password),
        onSuccess: async () => {
            await queryClient.fetchQuery({
                queryKey: ['current-user'],
                queryFn: getCurrentUser,
                retry: false,
            })
            navigate(redirectTo, {replace: true})
        },
    })

    const {data: user, isPending} = useQuery({
        queryKey: ['current-user'],
        queryFn: getCurrentUser,
        retry: false,
    })

    if (isPending) return null
    if (user) return <Navigate to={redirectTo} replace/>

    return (
        <AppShell>
            <Box
                sx={{
                    minHeight: '80svh',
                    display: 'grid',
                    placeItems: 'center',
                    rowGap: 1,
                }}
            >
                <Panel>
                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                        <Box
                            component="img"
                            src={logo}
                            alt="Rakez logo"
                            sx={{width: 70, height: 'auto', display: 'block', flexShrink: 0}}
                        />

                        <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 0}}>
                            <Box
                                component="img"
                                src={wordmark}
                                alt="Rakez"
                                sx={{width: 200, height: 'auto', display: 'block'}}
                            />
                            <Box
                                component="img"
                                src={heromark}
                                alt="Coordinate with purpose"
                                sx={{width: 150, height: 'auto', display: 'block', mt: -1}}
                            />
                        </Box>
                    </Box>

                    <Box
                        component="form"
                        onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
                        sx={{display: 'grid', gap: 2}}
                    >
                        <Controller
                            control={control}
                            name="username"
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Username"
                                    autoComplete="username"
                                    error={Boolean(errors.username)}
                                    helperText={errors.username?.message}
                                    fullWidth
                                />
                            )}
                        />

                        <Controller
                            control={control}
                            name="password"
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Password"
                                    type="password"
                                    autoComplete="current-password"
                                    error={Boolean(errors.password)}
                                    helperText={errors.password?.message}
                                    fullWidth
                                />
                            )}
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loginMutation.isPending}
                        >
                            {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
                        </Button>
                    </Box>
                </Panel>
                <ApiErrorSnackbar
                    error={loginMutation.error}
                    onClose={() => loginMutation.reset()}
                />
            </Box>
            <Box
                component="footer"
                sx={{
                    position: 'fixed',
                    bottom: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '100%',
                    display: {xxs: 'none', xs: 'flex', sm: 'flex'},
                    justifyContent: 'center',
                    py: 1.5,
                    px: 2,
                    opacity: '40%'
                }}
            >
                <Link
                    href="https://github.com/kavod-or/rakez"
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    color="text.secondary"
                    sx={{display: 'inline-flex', alignItems: 'center', gap: 0.75}}
                >
                    <GitHubIcon fontSize="small"/>
                    GitHub
                </Link>
            </Box>
        </AppShell>
    )
}
