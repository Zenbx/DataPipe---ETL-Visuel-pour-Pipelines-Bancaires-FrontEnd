'use client'

export function AuthFormError({ message }: { message: string | null }) {
  if (!message) return null

  return (
    <div
      role="alert"
      className="rounded-lg border px-3 py-2.5 text-xs leading-relaxed"
      style={{
        borderColor: 'rgba(239,68,68,0.35)',
        background: 'rgba(239,68,68,0.08)',
        color: '#fca5a5',
      }}
    >
      {message}
    </div>
  )
}
