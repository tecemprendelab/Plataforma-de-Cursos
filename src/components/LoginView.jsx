// ============================================================
//  LoginView.jsx — Pantalla de acceso del admin
//  Email + password contra Supabase Auth.
// ============================================================

import { useState } from 'react'
import Logo from './Logo.jsx'

export default function LoginView({ onSignIn }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await onSignIn(email, password)
    setLoading(false)
    if (error) setError(error.message || 'No se pudo iniciar sesión')
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <Logo height={36} style={{ margin:'0 auto 10px' }} />
          <p className="poppins-regular">Gestión de cursos virtuales</p>
        </div>

        <label className="login-field">
          <span className="poppins-medium">Correo</span>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tecemprendelab@itcr.ac.cr"
            autoComplete="email"
            required
          />
        </label>

        <label className="login-field">
          <span className="poppins-medium">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <div className="login-error poppins-medium">{error}</div>}

        <button
          type="submit"
          className="login-btn poppins-semibold"
          disabled={loading}
        >
          {loading ? 'Verificando…' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  )
}
