import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Power, Trash2 } from 'lucide-react'
import { api } from '../services/api'
import { brl, Modal, Spinner } from '../lib/ui'

const NOVO = { nome: '', preco: '', tipo: 'UNIDADE', categoria_id: '', ativo: true, baixa_ao_ativar: false, buffetItens: [] }

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
  const [bInsumo, setBInsumo] = useState('')
  const [bQtd, setBQtd] = useState('')

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
  const catBuffet = useMemo(() => categorias.find((c) => c.nome === 'Buffet'), [categorias])
  const insumosBuffet = useMemo(() => insumos.filter((i) => i.ingrediente), [insumos])

  const limparBuffetAdd = () => {
    setBInsumo('')
    setBQtd('')
  }

  const abrirNovo = () => {
    setForm({ ...NOVO, categoria_id: categorias[0]?.id || '' })
    setNovaCat('')
    setFicha([])
    limparBuffetAdd()
    setEditando('novo')
  }

  const abrirEdicao = async (p) => {
    let linhas = []
    try {
      linhas = await api.ficha(p.id)
    } catch {
      linhas = []
    }
    setForm({
      nome: p.nome,
      preco: String(p.preco),
      tipo: p.tipo,
      categoria_id: p.categoria_id || '',
      ativo: p.ativo,
      baixa_ao_ativar: !!p.baixa_ao_ativar,
      buffetItens: linhas.map((l) => ({ insumo_id: l.insumo_id, qtd_usada: Number(l.qtd_usada) })),
      id: p.id,
    })
    setNovaCat('')
    setFicha(linhas)
    limparBuffetAdd()
    setEditando(p)
  }

  const addBuffetItem = () => {
    const id = Number(bInsumo)
    const qtd = Number(bQtd)
    if (!id || !(qtd > 0)) return
    setForm((f) => ({
      ...f,
      buffetItens: [...f.buffetItens.filter((x) => x.insumo_id !== id), { insumo_id: id, qtd_usada: qtd }],
    }))
    limparBuffetAdd()
  }

  const rmBuffetItem = (id) => {
    setForm((f) => ({ ...f, buffetItens: f.buffetItens.filter((x) => x.insumo_id !== id) }))
  }

  const escolherModo = (buffet) => {
    setForm((f) => ({
      ...f,
      baixa_ao_ativar: buffet,
      categoria_id: buffet ? (catBuffet?.id || f.categoria_id) : f.categoria_id,
    }))
    if (buffet) setNovaCat('')
  }

  const salvar = async () => {
    setSalvando(true)
    setErro('')
    try {
      let categoriaId = form.categoria_id
      if (form.baixa_ao_ativar) {
        categoriaId = catBuffet ? catBuffet.id : (await api.criarCategoria('Buffet')).id
      } else if (novaCat.trim()) {
        categoriaId = (await api.criarCategoria(novaCat.trim())).id
      }

      const novoBuffet = editando === 'novo' && form.baixa_ao_ativar
      const corpo = {
        nome: form.nome,
        preco: form.baixa_ao_ativar ? 0 : Number(form.preco),
        tipo: form.tipo,
        categoria_id: categoriaId ? Number(categoriaId) : null,
        ativo: novoBuffet ? false : form.ativo,
        baixa_ao_ativar: form.baixa_ao_ativar,
      }

      let produtoId = form.id
      if (editando === 'novo') produtoId = (await api.criarProduto(corpo)).id
      else await api.atualizarProduto(form.id, corpo)

      if (form.baixa_ao_ativar) {
        await api.substituirFicha(
          produtoId,
          form.buffetItens.map((x) => ({ insumo_id: x.insumo_id, qtd_usada: x.qtd_usada })),
        )
      }

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
        baixa_ao_ativar: p.baixa_ao_ativar,
      })
      await carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  const excluir = async (p) => {
    if (!window.confirm(`Excluir "${p.nome}" do cardapio? Essa acao nao pode ser desfeita.`)) return
    setErro('')
    try {
      await api.removerProduto(p.id)
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
                  <td className="num mono">{p.baixa_ao_ativar ? '-' : `${brl(p.preco)}${p.tipo === 'KG' ? '/kg' : ''}`}</td>
                  <td><span className="chip neutral"><span className="chip-dot" />{p.baixa_ao_ativar ? 'buffet' : p.tipo === 'KG' ? 'por kg' : 'unidade'}</span></td>
                  <td>
                    {p.ativo ? <span className="chip ok"><span className="chip-dot" />ativo</span> : <span className="chip danger"><span className="chip-dot" />inativo</span>}
                  </td>
                  <td className="num">
                    <div className="row" style={{ justifyContent: 'flex-end', gap: 6 }}>
                      <button className="btn btn-sm btn-ghost" onClick={() => abrirEdicao(p)}><Pencil size={14} /> Editar</button>
                      <button className="btn btn-sm btn-ghost" title={p.ativo ? 'Desativar' : 'Ativar'} onClick={() => alternarAtivo(p)}><Power size={14} /></button>
                      <button className="btn btn-sm btn-ghost" title="Excluir" onClick={() => excluir(p)}><Trash2 size={14} /></button>
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
        subtitle="Monte o item do cardápio e, se precisar, ligue a baixa de estoque."
      >
        <div className="stack">
          <label className="field">Nome<input placeholder="Ex: Suco de laranja" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} autoFocus /></label>

          <div>
            <div className="field" style={{ marginBottom: 8 }}>Como é cobrado</div>
            <div className="seg2">
              <button type="button" className={!form.baixa_ao_ativar ? 'on' : ''} onClick={() => escolherModo(false)}>
                <b>Para venda</b>
                <small>Bebida, porção, prato. Tem preço e entra na comanda.</small>
              </button>
              <button type="button" className={form.baixa_ao_ativar ? 'on' : ''} onClick={() => escolherModo(true)}>
                <b>Vai pro buffet</b>
                <small>Sai do estoque quando você ativa. Fica na categoria Buffet.</small>
              </button>
            </div>
          </div>

          {form.baixa_ao_ativar ? (
            <div className="ficha-box" style={{ borderTop: 'none', paddingTop: 0 }}>
              <div className="field" style={{ marginBottom: 4 }}>O que vai pro buffet</div>
              <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
                Adicione os itens do estoque que vão pro buffet (arroz, óleo, alho...). Ao ativar o prato, tudo isso é descontado.
              </p>
              {form.buffetItens.length ? (
                <div className="ficha-list">
                  {form.buffetItens.map((x) => (
                    <div className="ficha-row" key={x.insumo_id}>
                      <span>{insumoNome[x.insumo_id]?.nome || `Item ${x.insumo_id}`}</span>
                      <span className="row" style={{ gap: 10 }}>
                        <span className="mono muted">{x.qtd_usada} {insumoNome[x.insumo_id]?.unidade || ''}</span>
                        <button className="oi-remove" onClick={() => rmBuffetItem(x.insumo_id)} title="Remover"><Trash2 size={14} /></button>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>Nenhum item ainda. Adicione pelo menos um.</p>
              )}
              <div className="ficha-add">
                <select value={bInsumo} onChange={(e) => setBInsumo(e.target.value)}>
                  <option value="">Item do estoque...</option>
                  {insumosBuffet.map((i) => <option key={i.id} value={i.id}>{i.nome} ({i.unidade})</option>)}
                </select>
                <input type="number" step="0.001" min="0" placeholder="Qtd" value={bQtd} onChange={(e) => setBQtd(e.target.value)} />
                <button className="btn btn-sm btn-primary" onClick={addBuffetItem}><Plus size={15} /></button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label className="field">Preço (R$)<input type="number" step="0.01" min="0" placeholder="0,00" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} /></label>
                <label className="field">Tipo
                  <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                    <option value="UNIDADE">Por unidade</option>
                    <option value="KG">Por quilo</option>
                  </select>
                </label>
              </div>

              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label className="field">Categoria
                  <select value={novaCat ? '' : form.categoria_id} onChange={(e) => { setForm({ ...form, categoria_id: e.target.value }); setNovaCat('') }}>
                    <option value="">Escolha...</option>
                    {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </label>
                <label className="field">ou nova<input placeholder="Ex: Lanches" value={novaCat} onChange={(e) => setNovaCat(e.target.value)} /></label>
              </div>
            </>
          )}

          {!form.baixa_ao_ativar && editando !== 'novo' && (
            <div className="ficha-box">
              <div className="field" style={{ marginBottom: 4 }}>Ficha técnica (baixa por venda)</div>
              <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
                Quanto de cada insumo sai do estoque a cada venda deste item.
              </p>
              {ficha.length ? (
                <div className="ficha-list">
                  {ficha.map((f) => (
                    <div className="ficha-row" key={f.insumo_id}>
                      <span>{insumoNome[f.insumo_id]?.nome || `Insumo ${f.insumo_id}`}</span>
                      <span className="mono muted">{f.qtd_usada} {insumoNome[f.insumo_id]?.unidade || ''}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>Sem ficha. O estoque não baixa neste produto.</p>
              )}
              <div className="ficha-add">
                <select value={fInsumo} onChange={(e) => setFInsumo(e.target.value)}>
                  <option value="">Insumo...</option>
                  {insumos.map((i) => <option key={i.id} value={i.id}>{i.nome}</option>)}
                </select>
                <input type="number" step="0.001" min="0" placeholder="Qtd" value={fQtd} onChange={(e) => setFQtd(e.target.value)} />
                <button className="btn btn-sm btn-primary" onClick={addFicha}><Plus size={15} /></button>
              </div>
            </div>
          )}

          <button className="btn btn-primary btn-lg btn-block" style={{ marginTop: 4 }} onClick={salvar} disabled={salvando || form.nome.length < 2 || (form.baixa_ao_ativar ? form.buffetItens.length === 0 : !Number(form.preco))}>
            {salvando ? <Spinner /> : 'Salvar produto'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
