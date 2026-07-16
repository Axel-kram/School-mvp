import { NavLink } from 'react-router-dom'

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink
        to="/"
        end
        className={({ isActive }) => 'bottom-nav-item' + (isActive ? ' bottom-nav-item-active' : '')}
      >
        Dashboard
      </NavLink>
      <NavLink
        to="/profil"
        className={({ isActive }) => 'bottom-nav-item' + (isActive ? ' bottom-nav-item-active' : '')}
      >
        Profil
      </NavLink>
    </nav>
  )
}
