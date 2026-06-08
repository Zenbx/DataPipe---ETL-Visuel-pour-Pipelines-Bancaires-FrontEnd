'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { useAuthStore } from '@/store/auth.store'
import { login as loginRequest, getCurrentUser } from '@/lib/api/auth'
import { formatLoginError } from '@/lib/api/authErrors'
import { AuthFormError } from '@/components/auth/AuthFormError'
import { toast } from 'sonner'
import { AuthGlassCard, AuthPageShell } from '@/components/auth/AuthPageShell'

export default function LoginPage() {
  const router   = useRouter()
  const { setUser } = useAuthStore()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mounted,   setMounted]   = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => { setTimeout(() => setMounted(true), 80) }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setIsLoading(true)
    setFormError(null)
    try {
      await loginRequest(email, password)
      const user = await getCurrentUser()
      setUser(user)
      router.push('/dashboard')
    } catch (err) {
      const message = formatLoginError(err)
      setFormError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthPageShell>
      <AuthGlassCard mounted={mounted}>
          {/* Logo */}
          <div style={{ marginBottom: 32 }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <Image src="/logo.png" alt="DataPipe" width={52} height={52} style={{ borderRadius: 9 }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.2px' }}>DataPipe</span>
            </Link>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight:200 , color: '#f5f5f5', letterSpacing: '-0.5px', lineHeight: 1.15, marginBottom: 6 }}>
              Content de vous revoir
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.32)', lineHeight: 1.5 }}>
              Pas encore de compte ?{' '}
              <Link href="/register" style={{ color: '#ff6d35', textDecoration: 'none' }}
                onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseOut={e  => (e.currentTarget.style.textDecoration = 'none')}>
                Créer un compte
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <AuthFormError message={formError} />

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2px' }}>
                Adresse email
              </label>
              <input
                type="email"
                placeholder="vous@acme.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setFormError(null) }}
                required
                autoComplete="email"
                autoFocus
                style={{
                  height: 42,
                  padding: '0 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 10,
                  color: '#f0f0f0',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = '#ff6d35'
                  e.currentTarget.style.background   = 'rgba(255,109,53,0.04)'
                  e.currentTarget.style.boxShadow    = '0 0 0 3px rgba(255,109,53,0.12)'
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'
                  e.currentTarget.style.background   = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.boxShadow    = 'none'
                }}
              />
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2px' }}>
                  Mot de passe
                </label>
                <Link href="/forgot-password" style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseOver={e => (e.currentTarget.style.color = '#ff6d35')}
                  onMouseOut={e  => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}>
                  Oublié ?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setFormError(null) }}
                  required
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    height: 42,
                    padding: '0 40px 0 14px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: 10,
                    color: '#f0f0f0',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = '#ff6d35'
                    e.currentTarget.style.background   = 'rgba(255,109,53,0.04)'
                    e.currentTarget.style.boxShadow    = '0 0 0 3px rgba(255,109,53,0.12)'
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'
                    e.currentTarget.style.background   = 'rgba(255,255,255,0.04)'
                    e.currentTarget.style.boxShadow    = 'none'
                  }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPwd(!showPwd)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    color: 'rgba(255,255,255,0.25)', transition: 'color 0.15s',
                    display: 'flex', alignItems: 'center',
                  }}
                  onMouseOver={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                  onMouseOut={e  => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
                >
                  {showPwd ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: 4,
                height: 44,
                width: '100%',
                background: isLoading ? 'rgba(255,109,53,0.5)' : '#ff6d35',
                border: 'none',
                borderRadius: 11,
                color: '#fff',
                fontSize: 14,
                fontWeight: 200,
                fontFamily: 'inherit',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: isLoading ? 'none' : '0 4px 24px rgba(255,109,53,0.28)',
                transition: 'background 0.15s, box-shadow 0.15s, transform 0.1s',
                letterSpacing: '-0.1px',
              }}
              onMouseOver={e => { if (!isLoading) e.currentTarget.style.background = '#e85e2a' }}
              onMouseOut={e  => { if (!isLoading) e.currentTarget.style.background = '#ff6d35' }}
              onMouseDown={e => { if (!isLoading) e.currentTarget.style.transform = 'scale(0.98)' }}
              onMouseUp={e   => { if (!isLoading) e.currentTarget.style.transform = 'scale(1)' }}
            >
              {isLoading ? (
                <>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  Connexion…
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight style={{ width: 15, height: 15 }} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>ou</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          </div>

          {/* Google */}
          <button
            type="button"
            style={{
              width: '100%', height: 42,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              color: 'rgba(255,255,255,0.45)',
              fontSize: 13, fontFamily: 'inherit', fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseOver={e => {
              e.currentTarget.style.background    = 'rgba(255,255,255,0.06)'
              e.currentTarget.style.borderColor   = 'rgba(255,255,255,0.14)'
              e.currentTarget.style.color         = 'rgba(255,255,255,0.7)'
            }}
            onMouseOut={e => {
              e.currentTarget.style.background    = 'rgba(255,255,255,0.03)'
              e.currentTarget.style.borderColor   = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.color         = 'rgba(255,255,255,0.45)'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuer avec Google
          </button>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      </AuthGlassCard>
    </AuthPageShell>
  )
}