import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { TopBar } from '../components/TopBar'
import { alarms as alarmsApi, StudyAlarm } from '../lib/api'

const DAYS = ['M', 'T', 'O', 'T', 'F', 'L', 'S']
const DAY_FULL = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag']

function formatAlarmDays(days: number[]): string {
  if (days.length === 5 && !days.includes(5) && !days.includes(6)) return 'Vardagar'
  if (days.length === 7) return 'Varje dag'
  if (days.length === 0) return 'Inaktivt'
  return days.map(d => DAY_FULL[d]).join(', ')
}

export function AlarmsPage() {
  const navigate = useNavigate()
  const [alarmList, setAlarmList] = useState<StudyAlarm[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const data = await alarmsApi.getAll().catch(() => [])
    setAlarmList(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (alarm: StudyAlarm) => {
    await alarmsApi.toggle(alarm.id, !alarm.active).catch(() => {})
    setAlarmList(list => list.map(a => a.id === alarm.id ? { ...a, active: !a.active } : a))
  }

  const handleDelete = async (id: string) => {
    await alarmsApi.delete(id).catch(() => {})
    setAlarmList(list => list.filter(a => a.id !== id))
  }

  return (
    <div className="app-shell">
      <TopBar showSubjects={false} title="Plugglarm" />
      <main className="page-content">

        <p className="subtitle">
          Välj tider som faktiskt passar din dag — ett larm du snoozer hjälper ingen. Appen skickar en smart påminnelse med förslag på vad du ska träna.
        </p>

        <div className="section-header">
          <p className="section-label" style={{ margin: 0 }}>Dina larm</p>
          <button className="add-link" onClick={() => navigate('/alarms/add')}>+ Nytt larm</button>
        </div>

        {loading && <div className="loading-dots">Hämtar larm…</div>}

        {!loading && alarmList.length === 0 && (
          <div className="empty-state">
            Inga larm satta ännu.<br />
            Lägg till ett larm för att få påminnelser om studietid.
          </div>
        )}

        {alarmList.map(alarm => (
          <div key={alarm.id} className="alarm-item">
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 20, fontWeight: 600, color: 'var(--text1)' }}>
                  {alarm.time_of_day.slice(0, 5)}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                  {alarm.subject} · {alarm.duration_minutes} min
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
                {formatAlarmDays(alarm.days_of_week)}
              </div>
              <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
                {DAYS.map((d, i) => (
                  <div
                    key={i}
                    className={`day-dot ${alarm.days_of_week.includes(i) ? 'active' : ''}`}
                    style={{ width: 26, height: 26, fontSize: 11 }}
                  >
                    {d}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
              <div
                className={`toggle ${alarm.active ? 'on' : ''}`}
                onClick={() => handleToggle(alarm)}
              >
                <div className="toggle-dot" />
              </div>
              <button
                className="btn-ghost"
                onClick={() => handleDelete(alarm.id)}
                style={{ fontSize: 11, color: 'var(--red-text)' }}
              >
                Ta bort
              </button>
            </div>
          </div>
        ))}

      </main>
      <BottomNav />
    </div>
  )
}
