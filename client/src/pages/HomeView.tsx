import { Link, useNavigate } from 'react-router'
import type { Fillup } from '../api'
import { useTracker } from './Tracker'
import SummaryCard from '../components/SummaryCard'
import Charts from '../components/Charts'
import FillupList from '../components/FillupList'
import MaintenanceCard from '../components/MaintenanceCard'

export default function HomeView() {
  const { items, summary, settings, deleteFillup, saveSettings } = useTracker()
  const navigate = useNavigate()

  const remove = async (f: Fillup) => {
    if (!confirm(`Usunąć tankowanie z ${f.date}?`)) return
    await deleteFillup(f.id)
  }

  return (
    <>
      {summary && settings && <MaintenanceCard m={summary.maintenance} settings={settings} onSave={saveSettings} />}
      {summary && <SummaryCard s={summary} />}
      <Link className="fab" to="/new">{items.length === 0 ? '+ Pierwsze tankowanie' : '+ Nowe tankowanie'}</Link>
      {settings && <Charts items={items} installCost={settings.installCost} />}
      <FillupList items={items} onEdit={(f) => navigate(`/edit/${f.id}`)} onDelete={remove} />
    </>
  )
}
