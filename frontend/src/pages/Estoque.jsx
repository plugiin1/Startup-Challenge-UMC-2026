import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Boxes, AlertTriangle, PackagePlus, Plus, Pencil } from 'lucide-react'
import { api } from '../services/api'
import { fadeUp, Modal, Spinner } from '../lib/ui'

const NOVO = { nome: '', unidade: 'kg', qtd_atual: '', qtd_minima: '', ingrediente: true }

export default function Estoque() {
  const [insumos, setInsumos] = useState([])
  const [erro, setErro] = useState('')
  const [insumoId, setInsumoId] = useState('')
  const [tipo, setTipo] = useState('ENTRADA')
  const [qtd, setQtd] = useState('')

  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(NOVO)
  const [salvando, setSalvando] = useState(false)

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

  const abrirNovo = () => {
    setForm(NOVO)
    setEditando('novo')
  }

  const abrirEdicao = (i) => {
    setForm({ nome: i.nome, unidade: i.unidade, qtd_atual: String(i.qtd_atual), qtd_minima: String(i.qtd_minima), ingrediente: i.ingrediente !== false, id: i.id })
    setEditando(i)
  }

  const salvar = async () => {
    setSalvando(true)
    setErro('')
    try {
      const corpo = {
        nome: form.nome.trim(),
        unidade: form.unidade.trim() || 'UN',
        qtd_atual: Number(form.qtd_atual) || 0,
        qtd_minima: Number(form.qtd_minima) || 0,
        ingrediente: form.ingrediente,
      }
      if (editando === 'novo') await api.criarInsumo(corpo)
      else await api.atualizarInsumo(form.id, corpo)
      setEditando(null)
      await carregar()
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  const emAlerta = insumos.filter((i) => i.abaixo_do_minimo)

  return (
    <div>
      <div className="page-head">
        <div className="eyebrow">Estoque</div>
        <h1>Controle de estoque</h1>
        <p>Ajuste o que tem em casa, defina o mínimo e deixe o sistema avisar quando estiver acabando.</p>
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
                  <option value="AJUSTE">Ajuste (definir total)</option>
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
            <button className="btn btn-sm btn-primary" style={{ marginLeft: 'auto' }} onClick={abrirNovo}>
              <Plus size={15} /> Novo
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th className="num">Atual</th>
                  <th className="num">Mínimo</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {insumos.map((i) => (
                  <tr key={i.id} className={i.abaixo_do_minimo ? 'row-alert' : ''}>
                    <td>{i.nome}</td>
                    <td className="num mono">{i.qtd_atual} {i.unidade}</td>
                    <td className="num mono muted">{i.qtd_minima} {i.unidade}</td>
                    <td>
                      <span className={`chip ${i.abaixo_do_minimo ? 'danger' : 'ok'}`}>
                        <span className="chip-dot" />{i.abaixo_do_minimo ? 'baixo' : 'ok'}
                      </span>
                    </td>
                    <td className="num">
                      <button className="btn btn-sm btn-ghost" onClick={() => abrirEdicao(i)}><Pencil size={14} /> Editar</button>
                    </td>
                  </tr>
                ))}
                {insumos.length === 0 && (
                  <tr><td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 24 }}>Nenhum insumo cadastrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>

      <Modal
        open={!!editando}
        onClose={() => !salvando && setEditando(null)}
        title={editando === 'novo' ? 'Novo insumo' : 'Editar insumo'}
        subtitle="Defina quanto tem em casa e o mínimo para o alerta."
      >
        <div className="stack">
          <label className="field">Nome<input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></label>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label className="field">Unidade<input placeholder="kg, un, L" value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} /></label>
            <label className="field">Quantidade atual<input type="number" step="0.001" min="0" value={form.qtd_atual} onChange={(e) => setForm({ ...form, qtd_atual: e.target.value })} /></label>
          </div>
          <label className="field">Mínimo para alertar<input type="number" step="0.001" min="0" value={form.qtd_minima} onChange={(e) => setForm({ ...form, qtd_minima: e.target.value })} /></label>
          <label className="row" style={{ gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
            <input type="checkbox" style={{ width: 18, height: 18, marginTop: 2 }} checked={form.ingrediente} onChange={(e) => setForm({ ...form, ingrediente: e.target.checked })} />
            <span>
              <b style={{ fontSize: 14 }}>Ingrediente de buffet</b>
              <small className="muted" style={{ display: 'block', fontSize: 12.5 }}>Aparece na lista ao montar um prato de buffet. Deixe desmarcado pra itens de revenda (bebidas).</small>
            </span>
          </label>
          {erro && <p className="form-msg-erro">{erro}</p>}
          <button className="btn btn-primary btn-block" onClick={salvar} disabled={salvando || form.nome.trim().length < 2}>
            {salvando ? <Spinner /> : 'Salvar insumo'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
