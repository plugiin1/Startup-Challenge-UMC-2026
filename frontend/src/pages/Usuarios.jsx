import { useEffect, useState } from 'react'
import { UserPlus, Power, Trash2 } from 'lucide-react'
import { api } from '../services/api'
import { Modal, Spinner } from '../lib/ui'

const COR = { GERENTE: '#6e1a15', CAIXA: '#1f5d7a' }
const VAZIO = { nome: '', email: '', senha: '', perfil: 'CAIXA' }

export default function Usuarios() {
  const [lista, setLista] = useState([])
  const [erro, setErro] = useState('')
  const [novo, setNovo] = useState(false)
  const [form, setForm] = useState(VAZIO)
  const [salvando, setSalvando] = useState(false)

  const carregar = () => api.usuarios().then(setLista).catch((e) => setErro(e.message))
  useEffect(() => {
    carregar()
  }, [])

  const criar = async () => {
    setSalvando(true)
    setErro('')
    try {
      await api.criarUsuario(form)
      setNovo(false)
      setForm(VAZIO)
      carregar()
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  const alternar = async (id) => {
    try {
      await api.alternarUsuario(id)
      carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  const excluir = async (u) => {
    const ok = window.confirm(
      `Excluir ${u.nome} de vez?

O histórico de vendas e de caixa continua salvo, mas sem o nome dele. Essa ação não pode ser desfeita.`,
    )
    if (!ok) return
    setErro('')
    try {
      await api.removerUsuario(u.id)
      carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <div>
      <div className="page-head">
        <div className="eyebrow">Gerência</div>
        <h1>Usuários</h1>
        <p>Cadastre os caixas da equipe. Só o gerente acessa esta tela.</p>
      </div>

      {erro && <p className="form-msg-erro" style={{ marginBottom: 16 }}>{erro}</p>}

      <div className="row spread" style={{ marginBottom: 16 }}>
        <span className="muted">{lista.length} usuários</span>
        <button className="btn btn-primary" onClick={() => setNovo(true)}>
          <UserPlus size={16} /> Novo usuário
        </button>
      </div>

      <section className="glass glass-pad">
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((u) => (
                <tr key={u.id}>
                  <td>{u.nome}</td>
                  <td className="muted">{u.email}</td>
                  <td>
                    <span className="chip neutral" style={{ color: COR[u.perfil] }}>
                      <span className="chip-dot" />
                      {u.perfil}
                    </span>
                  </td>
                  <td>
                    {u.ativo ? (
                      <span className="chip ok"><span className="chip-dot" />ativo</span>
                    ) : (
                      <span className="chip danger"><span className="chip-dot" />inativo</span>
                    )}
                  </td>
                  <td className="num">
                    {u.perfil !== 'GERENTE' && (
                      <div className="row" style={{ justifyContent: 'flex-end', gap: 6 }}>
                        <button className="btn btn-sm btn-ghost" onClick={() => alternar(u.id)}>
                          <Power size={14} /> {u.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                        <button className="btn btn-sm btn-ghost danger" title="Excluir usuário" onClick={() => excluir(u)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {lista.length === 0 && (
                <tr><td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 24 }}>Nenhum usuário.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={novo} onClose={() => !salvando && setNovo(false)} title="Novo usuário" subtitle="Gerentes não podem ser criados por aqui.">
        <div className="stack">
          <label className="field">Nome<input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></label>
          <label className="field">E-mail<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label className="field">Senha (mínimo 6)<input type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} /></label>
          <button className="btn btn-primary btn-block" onClick={criar} disabled={salvando || form.nome.length < 2 || form.senha.length < 6}>
            {salvando ? <Spinner /> : 'Criar usuário'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
