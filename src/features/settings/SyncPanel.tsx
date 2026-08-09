import { useState } from 'react'
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle, Mail } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useLockinStore } from '@/store/useLockinStore'

export function SyncPanel() {
  const syncEnabled = useLockinStore((s) => s.syncEnabled)
  const session = useLockinStore((s) => s.session)
  const syncStatus = useLockinStore((s) => s.syncStatus)
  const syncError = useLockinStore((s) => s.syncError)
  const authEmailSent = useLockinStore((s) => s.authEmailSent)
  const requestSignIn = useLockinStore((s) => s.requestSignIn)
  const signOutOfSync = useLockinStore((s) => s.signOutOfSync)

  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  if (!syncEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sync across devices</CardTitle>
        </CardHeader>
        <div className="p-4 flex items-start gap-3">
          <CloudOff size={16} className="text-tertiary mt-0.5 shrink-0" />
          <p className="text-[12px] text-secondary leading-relaxed">
            Sync isn't configured for this deployment yet. Add your Supabase project's{' '}
            <code className="text-[11px] bg-elevated px-1 py-0.5 rounded-[2px]">VITE_SUPABASE_URL</code> and{' '}
            <code className="text-[11px] bg-elevated px-1 py-0.5 rounded-[2px]">VITE_SUPABASE_ANON_KEY</code> as
            environment variables and redeploy — see the README for the full setup.
          </p>
        </div>
      </Card>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLocalError(null)
    if (!email.trim() || !email.includes('@')) {
      setLocalError('Enter a valid email address.')
      return
    }
    setSending(true)
    try {
      await requestSignIn(email.trim())
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Could not send the sign-in link.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sync across devices</CardTitle>
        <StatusBadge status={syncStatus} />
      </CardHeader>

      <div className="p-4">
        {session ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] text-primary">{session.user.email}</div>
              <div className="text-[11px] text-tertiary mt-0.5">
                Your habits sync automatically to every device you sign in on.
              </div>
              {syncStatus === 'error' && syncError && (
                <div className="text-[11px] text-red mt-1">{syncError}</div>
              )}
            </div>
            <Button variant="secondary" onClick={() => signOutOfSync()}>
              Sign out
            </Button>
          </div>
        ) : authEmailSent ? (
          <div className="flex items-start gap-3">
            <Mail size={16} className="text-cyan mt-0.5 shrink-0" />
            <div>
              <div className="text-[13px] text-primary">Check {authEmailSent}</div>
              <div className="text-[11px] text-tertiary mt-0.5">
                We sent a sign-in link. Open it on this device (or any device) to finish signing in — no
                password needed.
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <p className="text-[12px] text-secondary mb-1">
              Sign in with your email to sync habits and check-ins across your phone, laptop, and anywhere else.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 h-9 px-3 rounded-[3px] bg-elevated border border-hairline text-[13px] text-primary placeholder:text-tertiary focus-visible:outline-2 focus-visible:outline-cyan"
              />
              <Button type="submit" variant="primary" disabled={sending}>
                {sending ? 'Sending…' : 'Send link'}
              </Button>
            </div>
            {localError && <p className="text-[11px] text-red">{localError}</p>}
          </form>
        )}
      </div>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
    synced: { icon: <CheckCircle2 size={11} />, label: 'Synced', className: 'text-green' },
    syncing: { icon: <RefreshCw size={11} className="animate-spin" />, label: 'Syncing', className: 'text-cyan' },
    error: { icon: <AlertCircle size={11} />, label: 'Sync error', className: 'text-red' },
    'signed-out': { icon: <Cloud size={11} />, label: 'Not signed in', className: 'text-tertiary' },
  }
  const entry = map[status]
  if (!entry) return null
  return (
    <span className={`flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide ${entry.className}`}>
      {entry.icon}
      {entry.label}
    </span>
  )
}
