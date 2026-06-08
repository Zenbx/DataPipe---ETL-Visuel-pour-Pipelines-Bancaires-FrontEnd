'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react'
import Image from 'next/image'
import { forgotPassword } from '@/lib/api/auth'
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setTimeout(() => setMounted(true), 80) }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await forgotPassword(email)
      setSent(true)
      toast.success('Email envoyé si le compte existe')
    } catch {
      toast.error('Erreur')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthPageShell>
      <AuthGlassCard mounted={mounted}>
        <div style={{ marginBottom: 28 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <Image src="/logo.png" alt="DataPipe" width={52} height={52} style={{ borderRadius: 9 }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.2px' }}>DataPipe</span>
          </Link>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: 'rgba(59,130,246,0.12)',
              border: '1px solid rgba(59,130,246,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Mail style={{ width: 28, height: 28, color: '#3b82f6' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 200, color: '#f5f5f5', letterSpacing: '-0.4px', marginBottom: 8 }}>
                Email envoyé !
              </h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
                Vérifiez votre boîte mail et cliquez sur le lien de réinitialisation.
              </p>
            </div>
            <Link href="/login" style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', height: 44,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 11, color: 'rgba(255,255,255,0.7)',
              fontSize: 14, fontWeight: 500, textDecoration: 'none',
              transition: 'all 0.15s',
            }}>
              <ArrowLeft style={{ width: 15, height: 15 }} /> Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 24, fontWeight: 200, color: '#f5f5f5', letterSpacing: '-0.5px', marginBottom: 6 }}>
                Mot de passe oublié
              </h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.32)', lineHeight: 1.5 }}>
                Entrez votre email pour recevoir un lien de réinitialisation.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>
                  Adresse email
                </label>
                <input
                  type="email"
                  placeholder="vous@acme.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  height: 44, width: '100%',
                  background: isLoading ? 'rgba(255,109,53,0.5)' : '#ff6d35',
                  border: 'none', borderRadius: 11,
                  color: '#fff', fontSize: 14, fontWeight: 200, fontFamily: 'inherit',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: isLoading ? 'none' : '0 4px 24px rgba(255,109,53,0.28)',
                }}
              >
                {isLoading ? 'Envoi…' : <>Envoyer le lien <ArrowRight style={{ width: 15, height: 15 }} /></>}
              </button>
            </form>

            <Link href="/login" style={{
              marginTop: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontSize: 13, color: 'rgba(255,255,255,0.28)', textDecoration: 'none',
            }}>
              <ArrowLeft style={{ width: 14, height: 14 }} /> Retour
            </Link>
          </>
        )}
      </AuthGlassCard>
    </AuthPageShell>
  )
}
