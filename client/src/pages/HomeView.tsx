import { Link, useNavigate } from 'react-router'
import type { Fillup } from '../api'
import { useTracker } from './Tracker'
import SummaryCard from '../components/SummaryCard'
import Charts from '../components/Charts'
import FillupList from '../components/FillupList'

export default function HomeView() {
  const { items, summary, settings, deleteFillup } = useTracker()
  const navigate = useNavigate()

  const remove = async (f: Fillup) => {
    if (!confirm(`Usunąć tankowanie z ${f.date}?`)) return
    await deleteFillup(f.id)
  }

  return (
    <>
      {summary && <SummaryCard s={summary} />}
      <Link className="fab" to="/new">+ Nowe tankowanie</Link>
      {settings && <Charts items={items} installCost={settings.installCost} />}
      <FillupList items={items} onEdit={(f) => navigate(`/edit/${f.id}`)} onDelete={remove} />
    </>
  )
}
