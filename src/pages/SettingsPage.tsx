import { useRef, useState } from 'react'
import { Download, Upload, RotateCcw, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Toggle, SegmentedControl } from '@/components/ui/Toggle'
import { useLockinStore } from '@/store/useLockinStore'
import { validateBackup, type Backup } from '@/lib/storage'
import { todayISO } from '@/lib/date'
import { SyncPanel } from '@/features/settings/SyncPanel'

export function SettingsPage() {
  const settings = useLockinStore((s) => s.settings)
  const updateSettings = useLockinStore((s) => s.updateSettings)
  const exportData = useLockinStore((s) => s.exportData)
  const importData = useLockinStore((s) => s.importData)
  const resetDemoData = useLockinStore((s) => s.resetDemoData)
  const clearAllData = useLockinStore((s) => s.clearAllData)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importOk, setImportOk] = useState(false)
  const [confirmReset, setConfirmReset] = useState<'demo' | 'clear' | null>(null)

  async function handleExport() {
    const backup = await exportData()
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `LOCKIN-backup-${todayISO()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)
    setImportOk(false)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!validateBackup(data)) throw new Error('This file is missing required data.')
      await importData(data as Backup)
      setImportOk(true)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Could not import this file.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-[640px]">
      <div>
        <h1 className="text-[20px] font-semibold text-primary">Settings</h1>
        <p className="text-[13px] text-secondary mt-0.5">Preferences, backups, and data control.</p>
      </div>

      <SyncPanel />

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <div className="p-4 flex flex-col gap-4">
          <Row label="Theme">
            <SegmentedControl
              options={[
                { value: 'dark', label: 'Dark' },
                { value: 'light', label: 'Light' },
                { value: 'system', label: 'System' },
              ]}
              value={settings.theme}
              onChange={(theme) => updateSettings({ theme })}
            />
          </Row>
          <Row label="Start of week">
            <SegmentedControl
              options={[
                { value: '1', label: 'Monday' },
                { value: '0', label: 'Sunday' },
              ]}
              value={String(settings.startOfWeek) as '0' | '1'}
              onChange={(v) => updateSettings({ startOfWeek: Number(v) as 0 | 1 })}
            />
          </Row>
          <Row label="Animations">
            <Toggle checked={settings.animations} onChange={(animations) => updateSettings({ animations })} />
          </Row>
          <Row label="Reduce motion">
            <Toggle checked={settings.reducedMotion} onChange={(reducedMotion) => updateSettings({ reducedMotion })} />
          </Row>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
        </CardHeader>
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] text-primary">Export backup</div>
              <div className="text-[11px] text-tertiary">Download all habits and check-ins as JSON.</div>
            </div>
            <Button variant="secondary" onClick={handleExport}>
              <Download size={13} /> Export
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] text-primary">Import backup</div>
              <div className="text-[11px] text-tertiary">Replace current data with a backup file.</div>
            </div>
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload size={13} /> Import
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>
          {importError && <p className="text-[11px] text-red">{importError}</p>}
          {importOk && <p className="text-[11px] text-green">Import complete.</p>}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
        </CardHeader>
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] text-primary">Reset demo data</div>
              <div className="text-[11px] text-tertiary">Replace all data with a fresh demo dataset.</div>
            </div>
            <Button variant="secondary" onClick={() => setConfirmReset('demo')}>
              <RotateCcw size={13} /> Reset
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] text-primary">Clear all data</div>
              <div className="text-[11px] text-tertiary">Remove every habit and check-in permanently.</div>
            </div>
            <Button variant="danger" onClick={() => setConfirmReset('clear')}>
              <Trash2 size={13} /> Clear
            </Button>
          </div>
        </div>
      </Card>

      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmReset(null)} />
          <div className="relative bg-surface border border-hairline-strong rounded-[6px] p-5 w-full max-w-[380px]">
            <h2 className="text-[14px] font-semibold text-primary mb-2">
              {confirmReset === 'demo' ? 'Reset to demo data?' : 'Clear all data?'}
            </h2>
            <p className="text-[12px] text-secondary mb-4">
              This replaces your current habits and check-ins{confirmReset === 'demo' ? ' with fresh demo data' : ''}. This can't be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmReset(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (confirmReset === 'demo') resetDemoData()
                  else clearAllData()
                  setConfirmReset(null)
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-primary">{label}</span>
      {children}
    </div>
  )
}
