import { useCallback, useEffect, useState } from 'react'
import { api, type Fillup, type FillupInput, type Settings, type Summary } from '../api'

/** Server state for the logged-in tracker plus the mutations that keep it in sync. */
export function useTrackerData() {
  const [items, setItems] = useState<Fillup[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const refreshFillups = useCallback(async () => {
    const f = await api.fillups()
    setItems(f.items)
    setSummary(f.summary)
  }, [])

  const load = useCallback(async () => {
    try {
      const [f, s] = await Promise.all([api.fillups(), api.settings()])
      setItems(f.items)
      setSummary(f.summary)
      setSettings(s)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const saveFillup = async (input: FillupInput, editId: number | null) => {
    if (editId === null) await api.addFillup(input)
    else await api.updateFillup(editId, input)
    await refreshFillups()
  }

  const deleteFillup = async (id: number) => {
    await api.deleteFillup(id)
    await refreshFillups()
  }

  const saveSettings = async (s: Settings) => {
    setSettings(await api.saveSettings(s))
    await refreshFillups()
  }

  return { items, summary, settings, error, loaded, load, saveFillup, deleteFillup, saveSettings }
}
