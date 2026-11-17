import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { entrar } = useAuth()
  const [email, setEmail] = useState('admin@restaurante.com')
  const [senha, setSenha] = useState('admin123')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      await entrar(email, senha)
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={onSubmit}>
        <h1>Gestão do Restaurante</h1>
        <p className="muted">Entre com seu e-mail e senha</p>

        <label>
          E-mail
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Senha
          <input value={senha} onChange={(e) => setSenha(e.target.value)} type="password" required />
        </label>

        {erro && <p className="erro">{erro}</p>}

        <button className="primary" disabled={enviando}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
