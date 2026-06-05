// ============================================================
//  LoginView.jsx — Pantalla de acceso del admin
//  Email + password contra Supabase Auth.
// ============================================================

import { useState } from 'react'
import Logo from './Logo.jsx'

const labelStyle = {
  fontSize: 11, fontWeight: 700, letterSpacing: '.6px',
  textTransform: 'uppercase', color: 'var(--gray)',
}
const iconStyle = {
  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
  fontSize: 18, color: 'var(--gray)', pointerEvents: 'none',
}

export default function LoginView({ onSignIn }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
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
          <p className="poppins-regular">Panel de gestión</p>
        </div>

        <label className="login-field">
          <span style={labelStyle}>Correo electrónico</span>
          <div style={{ position:'relative' }}>
            <span className="material-symbols-outlined" aria-hidden="true" style={iconStyle}>mail</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tecemprendelab@itcr.ac.cr"
              autoComplete="email"
              required
              style={{ paddingLeft: 38, width:'100%' }}
            />
          </div>
        </label>

        <label className="login-field">
          <span style={labelStyle}>Contraseña</span>
          <div style={{ position:'relative' }}>
            <span className="material-symbols-outlined" aria-hidden="true" style={iconStyle}>lock</span>
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              style={{ paddingLeft: 38, paddingRight: 40, width:'100%' }}
            />
            <button type="button"
              onClick={() => setShowPwd(v => !v)}
              aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)',
                background:'none', border:'none', cursor:'pointer', color:'var(--gray)',
                display:'flex', alignItems:'center', padding:4 }}>
              <span className="material-symbols-outlined" style={{ fontSize:18 }}>
                {showPwd ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </label>

        {error && <div className="login-error poppins-medium">{error}</div>}

        <button
          type="submit"
          className="login-btn poppins-semibold"
          disabled={loading}
          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
        >
          {loading ? 'Verificando…' : 'Ingresar'}
          {!loading && <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize:18 }}>login</span>}
        </button>

        <div style={{ borderTop:'1px solid var(--cream-3)', marginTop:4, paddingTop:14, textAlign:'center' }}>
          <p style={{ fontSize:11, color:'var(--gray)', letterSpacing:'.3px' }}>
            © {new Date().getFullYear()} TEC Emprende Lab
          </p>
        </div>
      </form>
    </div>
  )
}
