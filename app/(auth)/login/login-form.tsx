'use client'
// Client component: handles form submission, signIn(), router navigation

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof loginSchema>

const DEMO_USERS = [
  { name: 'Marcus Adebayo', role: 'Contractor — Silver tier', email: 'marcus@adebayorenewables.co.za', destination: '/contractor' },
  { name: 'Lerato Mokoena', role: 'Service Provider', email: 'lerato@mokoenaeng.co.za', destination: '/service-provider' },
  { name: 'Sipho Dlamini', role: 'End-Client — Enterprise', email: 'sipho@spazaholdings.co.za', destination: '/client' },
  { name: 'Tess de Wet', role: 'End-Client — Standard', email: 'tess@durbanvillemall.co.za', destination: '/client' },
  { name: 'Erin Berman-Levy', role: 'Platform Admin', email: 'erin@see.platform', destination: '/admin' },
]

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [demoLoading, setDemoLoading] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: FormData) {
    setError(null)
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })
    if (result?.error) {
      setError('Invalid email or password.')
    } else {
      router.push('/contractor')
      router.refresh()
    }
  }

  async function handleDemoLogin(email: string, destination: string) {
    setDemoLoading(email)
    const result = await signIn('credentials', {
      email,
      password: 'demo1234',
      redirect: false,
    })
    if (result?.error) {
      setError('Demo login failed. Is the database seeded?')
      setDemoLoading(null)
    } else {
      router.push(destination)
      router.refresh()
    }
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              {...(errors.email?.message !== undefined && { error: errors.email.message })}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              {...(errors.password?.message !== undefined && { error: errors.password.message })}
              {...register('password')}
            />
            {error && (
              <p role="alert" className="text-sm text-danger-500">{error}</p>
            )}
            <Button type="submit" className="w-full" loading={isSubmitting}>
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Demo users</CardTitle>
          <p className="text-xs text-ink-500 mt-1">One-click access — no password required during demos</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {DEMO_USERS.map((u) => (
            <button
              key={u.email}
              type="button"
              onClick={() => handleDemoLogin(u.email, u.destination)}
              disabled={demoLoading !== null}
              className="w-full text-left rounded-md border border-ink-200 px-4 py-3 hover:bg-ink-50 transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:shadow-ring"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink-900">{u.name}</p>
                  <p className="text-xs text-ink-500">{u.role}</p>
                </div>
                {demoLoading === u.email && (
                  <svg className="animate-spin h-4 w-4 text-ink-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
