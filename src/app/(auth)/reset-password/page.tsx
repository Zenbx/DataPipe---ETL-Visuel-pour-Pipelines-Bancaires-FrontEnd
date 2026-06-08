'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { resetPassword } from '@/lib/api/auth'
import { toast } from 'sonner'
import { AuthGlassCard, AuthPageShell } from '@/components/auth/AuthPageShell'

const inputStyle: React.CSSProperties = {
  width: '100%',
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
}

const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = '#ff6d35'
  e.currentTarget.style.background = 'rgba(255,109,53,0.04)'
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,109,53,0.12)'
}

const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'
  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
  e.currentTarget.style.boxShadow = 'none'
}

function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [token, setToken] = useState(params.get('token') ?? '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setTimeout(() => setMounted(true), 80) }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { toast.error('Min. 8 caractères'); return }
    if (password !== confirm) { toast.error('Les mots de passe ne correspondent pas'); return }
    if (!token.trim()) { toast.error('Token requis'); return }
    setIsLoading(true)
    try {
      await resetPassword(token, password)
      toast.success('Mot de passe réinitialisé')
      router.push('/login')
    } catch {
      toast.error('Token invalide ou expiré')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthGlassCard mounted={mounted}>
      <div style={{ marginBottom: 28 }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Image src="/logo.png" alt="DataPipe" width={52} height={52} style={{ borderRadius: 9 }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.2px' }}>DataPipe</span>
        </Link>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 200, color: '#f5f5f5', letterSpacing: '-0.5px', marginBottom: 6 }}>
          Nouveau mot de passe
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.32)', lineHeight: 1.5 }}>
          Choisissez un nouveau mot de passe pour votre compte.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {!params.get('token') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>
              Token de réinitialisation
            </label>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              style={inputStyle}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>
            Nouveau mot de passe
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus={!!params.get('token')}
            style={inputStyle}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>
            Confirmer
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            style={inputStyle}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            marginTop: 4, height: 44, width: '100%',
            background: isLoading ? 'rgba(255,109,53,0.5)' : '#ff6d35',
            border: 'none', borderRadius: 11,
            color: '#fff', fontSize: 14, fontWeight: 200, fontFamily: 'inherit',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: isLoading ? 'none' : '0 4px 24px rgba(255,109,53,0.28)',
          }}
        >
          {isLoading ? 'Réinitialisation…' : <>Réinitialiser <ArrowRight style={{ width: 15, height: 15 }} /></>}
        </button>
      </form>

      <Link href="/login" style={{
        marginTop: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        fontSize: 13, color: 'rgba(255,255,255,0.28)', textDecoration: 'none',
      }}>
        <ArrowLeft style={{ width: 14, height: 14 }} /> Retour
      </Link>
    </AuthGlassCard>
  )
}

export default function ResetPasswordPage() {
  return (
    <AuthPageShell>
      <Suspense fallback={
        <AuthGlassCard mounted>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>Chargement…</p>
        </AuthGlassCard>
      }>
        <ResetPasswordForm />
      </Suspense>
    </AuthPageShell>
  )
}
