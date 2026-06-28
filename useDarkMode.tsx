import React from 'react'
import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/dashboard', icon: '⊞', label: 'Hem' },
  { to: '/timer',     icon: '⏱', label: 'Timer' },
  { to: '/alarms',   icon: '🔔', label: 'Larm' },
  { to: '/profile',  icon: '◯',  label: 'Profil' },
]

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {NAV.map(n => (
        <NavLink
          key={n.to}
          to={n.to}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-icon">{n.icon}</span>
          <span>{n.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
