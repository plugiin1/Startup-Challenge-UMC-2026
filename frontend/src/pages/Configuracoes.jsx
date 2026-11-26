import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { Spinner } from '../lib/ui'

export default function Configuracoes() {
  const [nome, setNome] = useState('')
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    api
      .config()
      .then((c) => setNome(c.nome_restaurante))
      .catch((e) => setErro(e.message))
  }, [])

  const salvar = async (e) => {
    e.preventDefault()
    setSalvando(true)
    setErro('')
    setOk(false)
    try {
      await api.salvarConfig({ nome_restaurante: nome })
      setOk(true)
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div>
      <div className="page-head">
        <div className="eyebrow">Gerência</div>
        <h1>Configurações</h1>
        <p>Nome do restaurante usado no sistema.</p>
      </div>

      <section className="glass glass-pad" style={{ maxWidth: 520 }}>
        <form className="stack" onSubmit={salvar}>
          <label className="field">
            Nome do restaurante
            <input value={nome} onChange={(e) => setNome(e.target.value)} required minLength={2} />
          </label>
          {erro && <p className="form-msg-erro">{erro}</p>}
          {ok && (
            <span className="chip ok" style={{ alignSelf: 'flex-start' }}>
              <span className="chip-dot" /> Salvo
            </span>
          )}
          <button className="btn btn-primary" disabled={salvando} style={{ alignSelf: 'flex-start' }}>
            {salvando ? <Spinner /> : 'Salvar'}
          </button>
        </form>
      </section>
    </div>
  )
}
