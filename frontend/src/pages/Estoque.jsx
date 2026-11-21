import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Boxes, AlertTriangle, PackagePlus } from 'lucide-react'
import { api } from '../services/api'
import { fadeUp } from '../lib/ui'

export default function Estoque() {
  const [insumos, setInsumos] = useState([])
  const [erro, setErro] = useState('')
  const [insumoId, setInsumoId] = useState('')
  const [tipo, setTipo] = useState('ENTRADA')
  const [qtd, setQtd] = useState('')

  const carregar = async () => {
    try {
      setInsumos(await api.insumos())
      setErro('')
    } catch (e) {
      setErro(e.message)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const movimentar = async (e) => {
    e.preventDefault()
    try {
      await api.movimentarEstoque({ insumo_id: Number(insumoId), tipo, qtd: Number(qtd) })
      setQtd('')
      await carregar()
    } catch (err) {
      setErro(err.message)
    }
  }

  const emAlerta = insumos.filter((i) => i.abaixo_do_minimo)

  return (
    <div>
      <div className="page-head">
        <div className="eyebrow">Estoque</div>
        <h1>Controle de estoque</h1>
        <p>A cada venda o sistema dá baixa sozinho. Você só repõe o que ele avisar que está acabando.</p>
      </div>

      {emAlerta.length > 0 && (
        <motion.div className="alert-bar" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <AlertTriangle />
          <span>
            <b>Repor hoje:</b> {emAlerta.map((i) => i.nome).join(', ')}
          </span>
        </motion.div>
      )}

      <div className="grid grid-2">
        <motion.section className="glass glass-pad" {...fadeUp}>
          <div className="card-title">
            <span className="ico"><PackagePlus /></span>
            <h3>Movimentar estoque</h3>
          </div>
          <form className="stack" onSubmit={movimentar}>
            <label className="field">
              Insumo
              <select value={insumoId} onChange={(e) => setInsumoId(e.target.value)} required>
                <option value="">Escolha...</option>
                {insumos.map((i) => (
                  <option key={i.id} value={i.id}>{i.nome}</option>
                ))}
              </select>
            </label>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label className="field">
                Tipo
                <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  <option value="ENTRADA">Entrada</option>
                  <option value="SAIDA">Saída</option>
                  <option value="AJUSTE">Ajuste</option>
                </select>
              </label>
              <label className="field">
                Quantidade
                <input type="number" step="0.001" placeholder="0" value={qtd} onChange={(e) => setQtd(e.target.value)} required />
              </label>
            </div>
            {erro && <p className="form-msg-erro">{erro}</p>}
            <button className="btn btn-primary btn-block">Registrar movimento</button>
          </form>
        </motion.section>

        <motion.section className="glass glass-pad" {...fadeUp}>
          <div className="card-title">
            <span className="ico"><Boxes /></span>
            <h3>Insumos</h3>
            {emAlerta.length > 0 && (
              <span className="chip danger" style={{ marginLeft: 'auto' }}>
                <span className="chip-dot" /> {emAlerta.length} em alerta
              </span>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th className="num">Atual</th>
                  <th className="num">Mínimo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {insumos.map((i) => (
                  <tr key={i.id} className={i.abaixo_do_minimo ? 'row-alert' : ''}>
                    <td>{i.nome}</td>
                    <td className="num mono">{i.qtd_atual} {i.unidade}</td>
                    <td className="num mono muted">{i.qtd_minima} {i.unidade}</td>
                    <td className="num">
                      <span className={`chip ${i.abaixo_do_minimo ? 'danger' : 'ok'}`}>
                        <span className="chip-dot" />{i.abaixo_do_minimo ? 'baixo' : 'ok'}
                      </span>
                    </td>
                  </tr>
                ))}
                {insumos.length === 0 && (
                  <tr><td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 24 }}>Nenhum insumo cadastrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>
    </div>
  )
}
