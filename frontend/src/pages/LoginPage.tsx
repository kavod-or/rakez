import {useState} from 'react'
import {z} from 'zod'
import {Controller, useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {useMutation} from '@tanstack/react-query'
import {useNavigate} from 'react-router-dom'
import {
    Alert,
    Box,
    Button,
    TextField,
} from '@mui/material'

import {login} from '../api/client'
import {AppShell} from '../components/layout/AppShell'
import {Panel} from '../components/layout/Panel'
import {ApiErrorSnackbar} from "../components/ui/ApiErrorSnackbar.tsx";

import heromark from '../assets/rakez_heromark.svg'
import logo from '../assets/rakez.svg'
import wordmark from '../assets/wordmark.svg'

const loginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
    const navigate = useNavigate()
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const {
        control,
        handleSubmit,
        formState: {errors},
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    })

    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const loginMutation = useMutation({
        mutationFn: async (values: LoginFormValues) => login(values.username, values.password),
        onSuccess: () => {
            setSuccessMessage('Logged in.')
            navigate('/dashboard', {replace: true})
        },
        onError: (error) => {
            setErrorMessage(error.message)
        },
    })

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
                    <Box sx={{display: 'grid', placeItems: 'center', width: 300}}>
                        <Box
                            component="img"
                            src={wordmark}
                            alt="Coordinate with purpose"
                            sx={{width: 200, height: 'auto', display: 'block'}}
                        />
                        <Box
                            component="img"
                            src={heromark}
                            alt="Coordinate with purpose"
                            sx={{width: 150, height: 'auto', display: 'block'}}
                        />
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

                        {loginMutation.error ? (
                            <ApiErrorSnackbar
                                open={Boolean(errorMessage)}
                                message={errorMessage}
                                onClose={() => setErrorMessage(null)}
                            />
                        ) : null}

                        {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}

                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loginMutation.isPending}
                        >
                            {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
                        </Button>
                    </Box>
                </Panel>
            </Box>
        </AppShell>
    )
}
