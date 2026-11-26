import { useState } from 'react'
import { Check, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Spinner } from '../lib/ui'
import Logo from '../components/Logo'

const DEMOS = [
  { nome: 'Gerente', email: 'gerente@restaurante.com', senha: 'gerente123', cor: '#6e1a15' },
  { nome: 'Caixa', email: 'caixa@restaurante.com', senha: 'caixa123', cor: '#15705a' },
]

const FEATS = [
  'A pesagem do prato vira comanda na hora',
  'O estoque baixa sozinho e avisa quando falta',
  'O caixa bate com a gaveta e as maquininhas',
  'O movimento do almoço num painel, em tempo real',
]

export default function Login() {
  const { entrar } = useAuth()
  const [email, setEmail] = useState('gerente@restaurante.com')
  const [senha, setSenha] = useState('gerente123')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const submeter = async (ev, e = email, s = senha) => {
    ev?.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      await entrar(e, s)
    } catch (err) {
      setErro(err.message)
      setEnviando(false)
    }
  }

  const demo = (d) => {
    setEmail(d.email)
    setSenha(d.senha)
    submeter(null, d.email, d.senha)
  }

  return (
    <div className="auth">
      <aside className="auth-aside">
        <Logo tone="light" size={44} />
        <h2>O buffet inteiro, num lugar só.</h2>
        <p className="lead">
          Pesagem, comandas, estoque e caixa conversando entre si, do primeiro prato do
          almoço ao fechamento do dia.
        </p>
        <ul className="feat-list">
          {FEATS.map((f) => (
            <li key={f}>
              <span className="ck">
                <Check />
              </span>
              {f}
            </li>
          ))}
        </ul>
      </aside>

      <div className="auth-form">
        <div className="auth-card">
          <Logo size={40} />
          <h1>Entrar</h1>
          <p className="muted" style={{ marginBottom: 22, fontSize: 14 }}>
            Entre com seu e-mail e senha.
          </p>

          <form className="stack" onSubmit={submeter}>
            <label className="field">
              E-mail
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </label>
            <label className="field">
              Senha
              <input value={senha} onChange={(e) => setSenha(e.target.value)} type="password" required />
            </label>

            {erro && <p className="form-msg-erro">{erro}</p>}

            <button className="btn btn-primary btn-lg btn-block" disabled={enviando} style={{ marginTop: 4 }}>
              {enviando ? <Spinner /> : <>Entrar <ArrowRight size={17} /></>}
            </button>
          </form>

          <div className="divider">ou teste com um perfil pronto</div>
          <div className="quick-logins">
            {DEMOS.map((d) => (
              <button key={d.email} className="quick-login" onClick={() => demo(d)} disabled={enviando}>
                <span className="qd" style={{ background: d.cor }} />
                {d.nome}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
