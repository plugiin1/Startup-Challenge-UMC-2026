import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Power } from 'lucide-react'
import { api } from '../services/api'
import { brl, Modal, Spinner } from '../lib/ui'

const NOVO = { nome: '', preco: '', tipo: 'UNIDADE', categoria_id: '', ativo: true }

export default function Cardapio() {
  const [produtos, setProdutos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [insumos, setInsumos] = useState([])
  const [erro, setErro] = useState('')

  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(NOVO)
  const [novaCat, setNovaCat] = useState('')
  const [salvando, setSalvando] = useState(false)

  const [ficha, setFicha] = useState([])
  const [fInsumo, setFInsumo] = useState('')
  const [fQtd, setFQtd] = useState('')

  const carregar = async () => {
    try {
      const [p, c] = await Promise.all([api.produtosTodos(), api.categorias()])
      setProdutos(p)
      setCategorias(c)
    } catch (e) {
      setErro(e.message)
    }
  }

  useEffect(() => {
    carregar()
    api.insumos().then(setInsumos).catch(() => {})
  }, [])

  const insumoNome = useMemo(() => Object.fromEntries(insumos.map((i) => [i.id, i])), [insumos])

  const abrirNovo = () => {
    setForm({ ...NOVO, categoria_id: categorias[0]?.id || '' })
    setNovaCat('')
    setFicha([])
    setEditando('novo')
  }

  const abrirEdicao = async (p) => {
    setForm({ nome: p.nome, preco: String(p.preco), tipo: p.tipo, categoria_id: p.categoria_id || '', ativo: p.ativo, id: p.id })
    setNovaCat('')
    setEditando(p)
    try {
      setFicha(await api.ficha(p.id))
    } catch {
      setFicha([])
    }
  }

  const salvar = async () => {
    setSalvando(true)
    setErro('')
    try {
      let categoriaId = form.categoria_id
      if (novaCat.trim()) {
        const cat = await api.criarCategoria(novaCat.trim())
        categoriaId = cat.id
      }
      const corpo = {
        nome: form.nome,
        preco: Number(form.preco),
        tipo: form.tipo,
        categoria_id: categoriaId ? Number(categoriaId) : null,
        ativo: form.ativo,
      }
      if (editando === 'novo') await api.criarProduto(corpo)
      else await api.atualizarProduto(form.id, corpo)
      setEditando(null)
      await carregar()
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  const alternarAtivo = async (p) => {
    setErro('')
    try {
      await api.atualizarProduto(p.id, {
        nome: p.nome,
        preco: Number(p.preco),
        tipo: p.tipo,
        categoria_id: p.categoria_id,
        ativo: !p.ativo,
      })
      await carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  const addFicha = async () => {
    if (!fInsumo || !fQtd) return
    try {
      await api.salvarFicha(form.id, { insumo_id: Number(fInsumo), qtd_usada: Number(fQtd) })
      setFInsumo('')
      setFQtd('')
      setFicha(await api.ficha(form.id))
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <div>
      <div className="page-head">
        <div className="eyebrow">Gerência</div>
        <h1>Cardápio</h1>
        <p>Cadastre e edite os pratos, bebidas e porções, com preço, categoria e ficha técnica.</p>
      </div>

      {erro && <p className="form-msg-erro" style={{ marginBottom: 16 }}>{erro}</p>}

      <div className="row spread" style={{ marginBottom: 16 }}>
        <span className="muted">{produtos.length} produtos</span>
        <button className="btn btn-primary" onClick={abrirNovo}><Plus size={16} /> Novo produto</button>
      </div>

      <section className="glass glass-pad">
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th className="num">Preço</th>
                <th>Tipo</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((p) => (
                <tr key={p.id}>
                  <td>{p.nome}</td>
                  <td className="muted">{p.categoria?.nome || '-'}</td>
                  <td className="num mono">{brl(p.preco)}{p.tipo === 'KG' ? '/kg' : ''}</td>
                  <td><span className="chip neutral"><span className="chip-dot" />{p.tipo === 'KG' ? 'por kg' : 'unidade'}</span></td>
                  <td>
                    {p.ativo ? <span className="chip ok"><span className="chip-dot" />ativo</span> : <span className="chip danger"><span className="chip-dot" />inativo</span>}
                  </td>
                  <td className="num">
                    <div className="row" style={{ justifyContent: 'flex-end', gap: 6 }}>
                      <button className="btn btn-sm btn-ghost" onClick={() => abrirEdicao(p)}><Pencil size={14} /> Editar</button>
                      <button className="btn btn-sm btn-ghost" onClick={() => alternarAtivo(p)}><Power size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {produtos.length === 0 && (
                <tr><td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 24 }}>Nenhum produto cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={!!editando}
        onClose={() => !salvando && setEditando(null)}
        title={editando === 'novo' ? 'Novo produto' : 'Editar produto'}
      >
        <div className="stack">
          <label className="field">Nome<input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></label>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label className="field">Preço (R$)<input type="number" step="0.01" min="0" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} /></label>
            <label className="field">Tipo
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                <option value="UNIDADE">Por unidade</option>
                <option value="KG">Por quilo</option>
              </select>
            </label>
          </div>
          <label className="field">Categoria
            <select value={novaCat ? '' : form.categoria_id} onChange={(e) => { setForm({ ...form, categoria_id: e.target.value }); setNovaCat('') }}>
              <option value="">Escolha...</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </label>
          <label className="field">ou nova categoria<input placeholder="Ex: Lanches" value={novaCat} onChange={(e) => setNovaCat(e.target.value)} /></label>

          {editando !== 'novo' && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <div className="field" style={{ marginBottom: 8 }}>Ficha técnica (baixa de estoque)</div>
              {ficha.length ? (
                <div className="stack" style={{ gap: 6, marginBottom: 10 }}>
                  {ficha.map((f) => (
                    <div className="row spread" key={f.insumo_id} style={{ fontSize: 13.5 }}>
                      <span>{insumoNome[f.insumo_id]?.nome || `Insumo ${f.insumo_id}`}</span>
                      <span className="mono muted">{f.qtd_usada} {insumoNome[f.insumo_id]?.unidade || ''}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted" style={{ fontSize: 13, marginBottom: 10 }}>Sem ficha. O estoque não baixa neste produto.</p>
              )}
              <div className="row" style={{ gap: 8 }}>
                <select value={fInsumo} onChange={(e) => setFInsumo(e.target.value)}>
                  <option value="">Insumo...</option>
                  {insumos.map((i) => <option key={i.id} value={i.id}>{i.nome}</option>)}
                </select>
                <input type="number" step="0.001" min="0" placeholder="Qtd" style={{ width: 90 }} value={fQtd} onChange={(e) => setFQtd(e.target.value)} />
                <button className="btn btn-sm" onClick={addFicha}><Plus size={14} /></button>
              </div>
            </div>
          )}

          <button className="btn btn-primary btn-block" onClick={salvar} disabled={salvando || form.nome.length < 2 || !Number(form.preco)}>
            {salvando ? <Spinner /> : 'Salvar produto'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
