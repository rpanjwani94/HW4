import { NavLink, useNavigate } from 'react-router-dom'
import { STORE } from '../config'
import { useAuth } from '../auth'
import YaleY from './YaleY'

export default function NavBar() {
  const { user, ready, logout } = useAuth()
  const navigate = useNavigate()

  const links = [
    { to: '/', label: 'Home' },
    { to: '/products', label: 'Products' },
    { to: '/about', label: 'About Us' },
    ...(user ? [] : [
      { to: '/login', label: 'Login' },
      { to: '/create-account', label: 'Create Account' },
    ]),
  ]

  async function onLogout() {
    await logout()
    navigate('/')
  }

  return (
    <header className="nav">
      <div className="nav-inner">
        <NavLink to="/" className="brand" aria-label={`${STORE.name} home`}>
          <YaleY size={36} inverted />
          <span>{STORE.name}</span>
        </NavLink>
        <nav aria-label="Main">
          <ul>
            {links.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} end={l.to === '/'}>{l.label}</NavLink>
              </li>
            ))}
            {ready && user && (
              <>
                <li className="nav-user">Hi, {user.first_name}</li>
                <li><button className="nav-logout" onClick={onLogout}>Log out</button></li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  )
}
