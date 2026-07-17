import { NavLink } from 'react-router-dom'

const items = [
  { to: '/dashboard', label: 'Hem', icon: '🏠', end: true },
  { to: '/chat', label: 'Chatt', icon: '💬' },
  { to: '/exams', label: 'Prov', icon: '📅' },
  { to: '/alarms', label: 'Larm', icon: '⏰' },
  { to: '/profil', label: 'Profil', icon: '👤' },
]

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            'bottom-nav-item' + (isActive ? ' bottom-nav-item-active' : '')
          }
        >
          <span className="bottom-nav-icon" aria-hidden="true">
            {item.icon}
          </span>
          <span className="bottom-nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
