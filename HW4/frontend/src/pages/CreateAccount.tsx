import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../api'

const MIN_PASSWORD = 8

export default function CreateAccount() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', confirm_password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`)
      return
    }
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await registerUser({ ...form, first_name: form.first_name.trim(), last_name: form.last_name.trim(), email: form.email.trim() })
      navigate('/login', { state: { created: true } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="page narrow">
      <h1>Create Account</h1>
      <form onSubmit={onSubmit}>
        <label htmlFor="first_name">First name</label>
        <input id="first_name" autoComplete="given-name" value={form.first_name} onChange={set('first_name')} required />
        <label htmlFor="last_name">Last name</label>
        <input id="last_name" autoComplete="family-name" value={form.last_name} onChange={set('last_name')} required />
        <label htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} required />
        <label htmlFor="password">Password</label>
        <input id="password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD} value={form.password} onChange={set('password')} required aria-describedby="pw-hint" />
        <small id="pw-hint">At least {MIN_PASSWORD} characters.</small>
        <label htmlFor="confirm_password">Confirm password</label>
        <input id="confirm_password" type="password" autoComplete="new-password" value={form.confirm_password} onChange={set('confirm_password')} required />
        {error && <p className="note error" role="alert">{error}</p>}
        <button className="button" type="submit" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
      <p>Already have an account? <Link to="/login">Log in</Link>.</p>
    </section>
  )
}
