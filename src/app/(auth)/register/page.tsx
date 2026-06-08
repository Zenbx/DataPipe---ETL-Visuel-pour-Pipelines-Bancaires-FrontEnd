'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import Image from 'next/image'
import { register as registerRequest } from '@/lib/api/auth'
import { formatRegisterError } from '@/lib/api/authErrors'
import { AuthFormError } from '@/components/auth/AuthFormError'
import { toast } from 'sonner'
import { AuthGlassCard, AuthPageShell } from '@/components/auth/AuthPageShell'

// ─────────────────────────────────────────────────────────────────────────
// Input style helpers
// ─────────────────────────────────────────────────────────────────────────
const inputBase: React.CSSProperties = {
  width: '100%', height: 42, padding: '0 14px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 10, color: '#f0f0f0',
  fontSize: 13, fontFamily: 'inherit', outline: 'none',
  transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
}
const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = '#ff6d35'
  e.currentTarget.style.background   = 'rgba(255,109,53,0.04)'
  e.currentTarget.style.boxShadow    = '0 0 0 3px rgba(255,109,53,0.12)'
}
const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'
  e.currentTarget.style.background   = 'rgba(255,255,255,0.04)'
  e.currentTarget.style.boxShadow    = 'none'
}

// ─────────────────────────────────────────────────────────────────────────
// Register Page
// ─────────────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const [form, setForm]       = useState({ name: '', email: '', password: '', org_name: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep]       = useState<'form' | 'success'>('form')
  const [mounted, setMounted] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => { setTimeout(() => setMounted(true), 80) }, [])

  const update = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm({ ...form, [k]: e.target.value })
      setFormError(null)
    }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 8) {
      const msg = 'Le mot de passe doit contenir au moins 8 caractères.'
      setFormError(msg)
      toast.error(msg)
      return
    }
    setIsLoading(true)
    setFormError(null)
    try {
      await registerRequest(form)
      setStep('success')
    } catch (err) {
      const message = formatRegisterError(err, { orgName: form.org_name })
      setFormError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthPageShell accent="violet">
      <AuthGlassCard mounted={mounted} maxWidth={440} shimmer="violet">
          {step === 'success' ? (
            /* ── Success ─────────────────────────────────────────────── */
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 18,
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 24px rgba(16,185,129,0.15)',
              }}>
                <Check style={{ width: 28, height: 28, color: '#10b981' }} />
              </div>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#f5f5f5', letterSpacing: '-0.4px', marginBottom: 8 }}>
                  Compte créé !
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
                  Vérifiez votre boîte mail pour confirmer<br />votre adresse, puis connectez-vous.
                </p>
              </div>
              <Link href="/login" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#ff6d35', color: '#fff',
                padding: '12px 24px', borderRadius: 11,
                fontSize: 14, fontWeight: 700, textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(255,109,53,0.28)',
                transition: 'background 0.15s',
              }}
                onMouseOver={e => (e.currentTarget.style.background = '#e85e2a')}
                onMouseOut={e  => (e.currentTarget.style.background = '#ff6d35')}
              >
                Se connecter <ArrowRight style={{ width: 15, height: 15 }} />
              </Link>
            </div>

          ) : (
            /* ── Form ────────────────────────────────────────────────── */
            <>
              {/* Logo */}
              <div style={{ marginBottom: 28 }}>
                <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                  <Image src="/logo.png" alt="DataPipe" width={52} height={52} style={{ borderRadius: 9 }} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.2px' }}>DataPipe</span>
                </Link>
              </div>

              {/* Heading */}
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 200, color: '#f5f5f5', letterSpacing: '-0.5px', marginBottom: 6 }}>
                  Créer un compte
                </h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.32)' }}>
                  Déjà inscrit ?{' '}
                  <Link href="/login" style={{ color: '#ff6d35', textDecoration: 'none' }}
                    onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseOut={e  => (e.currentTarget.style.textDecoration = 'none')}>
                    Se connecter
                  </Link>
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <AuthFormError message={formError} />

                {/* Nom */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2px' }}>
                    Nom complet
                  </label>
                  <input
                    placeholder="John Doe" value={form.name}
                    onChange={update('name')} required autoFocus
                    style={inputBase} onFocus={onFocus} onBlur={onBlur}
                  />
                </div>

                {/* Email */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2px' }}>
                    Adresse email
                  </label>
                  <input
                    type="email" placeholder="john@acme.com" value={form.email}
                    onChange={update('email')} required autoComplete="email"
                    style={inputBase} onFocus={onFocus} onBlur={onBlur}
                  />
                </div>

                {/* Password */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2px' }}>
                    Mot de passe
                  </label>
                  <input
                    type="password" placeholder="Min. 8 caractères" value={form.password}
                    onChange={update('password')} required autoComplete="new-password"
                    style={inputBase} onFocus={onFocus} onBlur={onBlur}
                  />
                  {form.password.length > 0 && form.password.length < 8 && (
                    <p style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>
                      Encore {8 - form.password.length} caractère{8 - form.password.length > 1 ? 's' : ''}
                    </p>
                  )}
                  {/* Password strength bar */}
                  {form.password.length > 0 && (
                    <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{
                          flex: 1, height: 2.5, borderRadius: 99,
                          background: form.password.length >= i * 2
                            ? i <= 1 ? '#ef4444' : i <= 2 ? '#f59e0b' : i <= 3 ? '#3b82f6' : '#10b981'
                            : 'rgba(255,255,255,0.08)',
                          transition: 'background 0.2s',
                        }} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Organisation */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2px', display: 'flex', gap: 6 }}>
                    Organisation
                    <span style={{ color: 'rgba(255,255,255,0.18)', fontWeight: 400 }}>optionnel</span>
                  </label>
                  <input
                    placeholder="Acme Corp" value={form.org_name}
                    onChange={update('org_name')}
                    style={inputBase} onFocus={onFocus} onBlur={onBlur}
                  />
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', lineHeight: 1.5, marginTop: 4 }}>
                    Chaque nom d’organisation doit être unique. En cas d’erreur, essayez un nom différent ou laissez vide.
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit" disabled={isLoading}
                  style={{
                    marginTop: 6, height: 44, width: '100%',
                    background: isLoading ? 'rgba(255,109,53,0.5)' : '#ff6d35',
                    border: 'none', borderRadius: 11,
                    color: '#fff', fontSize: 14, fontWeight: 200, fontFamily: 'inherit',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: isLoading ? 'none' : '0 4px 24px rgba(255,109,53,0.28)',
                    transition: 'background 0.15s, transform 0.1s',
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
                        border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                        animation: 'spin 0.7s linear infinite',
                      }} />
                      Création…
                    </>
                  ) : (
                    <>Créer mon compte <ArrowRight style={{ width: 15, height: 15 }} /></>
                  )}
                </button>

                <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.18)', lineHeight: 1.6 }}>
                  En créant un compte vous acceptez nos{' '}
                  <span style={{ color: 'rgba(255,255,255,0.32)', cursor: 'pointer' }}>Conditions d'utilisation</span>
                  {' '}et notre{' '}
                  <span style={{ color: 'rgba(255,255,255,0.32)', cursor: 'pointer' }}>Politique de confidentialité</span>.
                </p>
              </form>
            </>
          )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </AuthGlassCard>
    </AuthPageShell>
  )
}