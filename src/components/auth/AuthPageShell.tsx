'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { Poppins } from 'next/font/google'
import { AuthPipelineBackground } from '@/components/auth/AuthPipelineBackground'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
})

function CursorGlow({ accent = 'orange' }: { accent?: 'orange' | 'violet' }) {
  const ref = useRef<HTMLDivElement>(null)
  const color =
    accent === 'violet'
      ? 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 65%)'
      : 'radial-gradient(circle, rgba(255,109,53,0.06) 0%, transparent 65%)'

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!ref.current) return
      ref.current.style.left = `${e.clientX - 300}px`
      ref.current.style.top = `${e.clientY - 300}px`
    }
    window.addEventListener('mousemove', move, { passive: true })
    return () => window.removeEventListener('mousemove', move)
  }, [])

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed z-0 h-[600px] w-[600px] rounded-full"
      style={{
        background: color,
        transition: 'left 0.14s ease-out, top 0.14s ease-out',
        left: -300,
        top: -300,
      }}
    />
  )
}

export function AuthGlassCard({
  children,
  mounted,
  maxWidth = 420,
  shimmer = 'orange',
}: {
  children: ReactNode
  mounted: boolean
  maxWidth?: number
  shimmer?: 'orange' | 'violet'
}) {
  const shimmerBg =
    shimmer === 'violet'
      ? 'linear-gradient(135deg, rgba(168,85,247,0.04) 0%, transparent 40%, rgba(255,109,53,0.03) 100%)'
      : 'linear-gradient(135deg, rgba(255,109,53,0.04) 0%, transparent 40%, rgba(139,92,246,0.03) 100%)'

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth,
        margin: '0 24px',
        borderRadius: 20,
        overflow: 'hidden',
        background:
          'linear-gradient(to bottom, rgba(255,255,255,0.06) 0%, rgba(12,12,18,0.82) 35%, rgba(8,8,12,0.95) 100%)',
        backdropFilter: 'blur(32px) saturate(160%)',
        WebkitBackdropFilter: 'blur(32px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07), 0 40px 100px rgba(0,0,0,0.6)',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(20px)',
        transition:
          'opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background: shimmerBg,
        }}
      />
      <div style={{ position: 'relative', zIndex: 1, padding: '36px 36px 32px' }}>{children}</div>
    </div>
  )
}

export function AuthPageShell({
  children,
  accent = 'orange',
}: {
  children: ReactNode
  accent?: 'orange' | 'violet'
}) {
  const orbPrimary =
    accent === 'violet'
      ? 'radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 65%)'
      : 'radial-gradient(circle, rgba(255,109,53,0.08) 0%, transparent 65%)'
  const orbSecondary =
    accent === 'violet'
      ? 'radial-gradient(circle, rgba(255,109,53,0.06) 0%, transparent 65%)'
      : 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 65%)'

  return (
    <div
      className={poppins.className}
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: '#08080c',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
        backgroundSize: '14px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <CursorGlow accent={accent} />
      <div
        className="pointer-events-none absolute -top-60 -left-60 h-[600px] w-[600px] rounded-full"
        style={{ background: orbPrimary }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full"
        style={{ background: orbSecondary }}
      />
      <AuthPipelineBackground />
      {children}
    </div>
  )
}
