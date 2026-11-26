import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { Spinner } from '../lib/ui'

export default function Configuracoes() {
  const [nome, setNome] = useState('')
  const [taxa, setTaxa] = useState('10')
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    api
      .config()
      .then((c) => {
        setNome(c.nome_restaurante)
        setTaxa(String(c.taxa_servico_percent))
      })
      .catch((e) => setErro(e.message))
  }, [])

  const salvar = async (e) => {
    e.preventDefault()
    setSalvando(true)
    setErro('')
    setOk(false)
    try {
      await api.salvarConfig({ nome_restaurante: nome, taxa_servico_percent: Number(taxa) })
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
        <p>Nome do restaurante e a taxa de serviço cobrada no fechamento das comandas.</p>
      </div>

      <section className="glass glass-pad" style={{ maxWidth: 520 }}>
        <form className="stack" onSubmit={salvar}>
          <label className="field">
            Nome do restaurante
            <input value={nome} onChange={(e) => setNome(e.target.value)} required minLength={2} />
          </label>
          <label className="field">
            Taxa de serviço (%)
            <input type="number" step="0.5" min="0" max="100" value={taxa} onChange={(e) => setTaxa(e.target.value)} required />
          </label>
          <p className="muted" style={{ fontSize: 13 }}>
            A taxa entra automática no pagamento e pode ser removida pelo caixa em cada comanda.
          </p>
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
