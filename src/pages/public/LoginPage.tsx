import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError('Correo o contraseña incorrectos.')
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Iniciar sesión</h1>
        <p className="subtitle">Validador de boletos de bus</p>
        <form onSubmit={handleSubmit}>
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <div className="error-text">{error}</div>}
          <button className="btn" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <div className="auth-switch">
          ¿Eres operador nuevo? <Link to="/registro">Regístrate aquí</Link>
        </div>
      </div>
    </div>
  )
}
