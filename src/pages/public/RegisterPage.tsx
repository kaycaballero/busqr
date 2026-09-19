import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })
    setLoading(false)
    if (error) {
      setError(error.message || 'No se pudo crear la cuenta.')
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Crear cuenta de operador</h1>
        <p className="subtitle">Tu cuenta quedará pendiente hasta que el administrador la active.</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Nombre completo</label>
            <input className="input" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="field">
            <label>Correo electrónico</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input
              className="input"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <div className="error-text">{error}</div>}
          <button className="btn" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creando...' : 'Crear cuenta'}
          </button>
        </form>
        <div className="auth-switch">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </div>
      </div>
    </div>
  )
}
