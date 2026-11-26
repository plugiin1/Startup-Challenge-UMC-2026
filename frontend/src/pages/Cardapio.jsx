import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Plus, Pencil, Power, Search, Trash2, UtensilsCrossed } from 'lucide-react'
import { api } from '../services/api'
import { brl, Modal, Spinner } from '../lib/ui'

const NOVO = { nome: '', preco: '', tipo: 'UNIDADE', categoria_id: '', ativo: true, baixa_ao_ativar: false, buffetItens: [] }

const FILTROS = [
  { id: 'TODOS', nome: 'Tudo' },
  { id: 'BUFFET', nome: 'Buffet' },
  { id: 'VENDA', nome: 'Para venda' },
  { id: 'ATIVOS', nome: 'No ar agora' },
]

const num = (v) => Number(Number(v).toFixed(3))

export default function Cardapio() {
  const [produtos, setProdutos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [insumos, setInsumos] = useState([])
  const [fichas, setFichas] = useState({})
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('TODOS')

  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(NOVO)
  const [novaCat, setNovaCat] = useState('')
  const [salvando, setSalvando] = useState(false)

  const [ficha, setFicha] = useState([])
  const [fInsumo, setFInsumo] = useState('')
  const [fQtd, setFQtd] = useState('')
  const [bInsumo, setBInsumo] = useState('')
  const [bQtd, setBQtd] = useState('')

  const [confirmando, setConfirmando] = useState(null)
  const [aplicando, setAplicando] = useState(false)

  const carregar = async () => {
    try {
      const [p, c, i] = await Promise.all([api.produtosTodos(), api.categorias(), api.insumos()])
      setProdutos(p)
      setCategorias(c)
      setInsumos(i)

      const buffet = p.filter((x) => x.baixa_ao_ativar)
      const linhas = await Promise.all(
        buffet.map((x) => api.ficha(x.id).then((l) => [x.id, l]).catch(() => [x.id, []])),
      )
      setFichas(Object.fromEntries(linhas))
    } catch (e) {
      setErro(e.message)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const insumoNome = useMemo(() => Object.fromEntries(insumos.map((i) => [i.id, i])), [insumos])
  const catBuffet = useMemo(() => categorias.find((c) => c.nome === 'Buffet'), [categorias])
  const insumosBuffet = useMemo(() => insumos.filter((i) => i.ingrediente), [insumos])

  const faltaEstoque = (p) => {
    const linhas = fichas[p.id] || []
    return linhas.filter((l) => {
      const i = insumoNome[l.insumo_id]
      return i && Number(i.qtd_atual) < Number(l.qtd_usada)
    })
  }

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return produtos.filter((p) => {
      if (termo && !p.nome.toLowerCase().includes(termo)) return false
      if (filtro === 'BUFFET') return p.baixa_ao_ativar
      if (filtro === 'VENDA') return !p.baixa_ao_ativar
      if (filtro === 'ATIVOS') return p.ativo
      return true
    })
  }, [produtos, busca, filtro])

  const doBuffet = visiveis.filter((p) => p.baixa_ao_ativar)
  const paraVenda = visiveis.filter((p) => !p.baixa_ao_ativar)
  const ativos = produtos.filter((p) => p.ativo).length

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

  const trocarAtivo = async (p, ativo) => {
    await api.atualizarProduto(p.id, {
      nome: p.nome,
      preco: Number(p.preco),
      tipo: p.tipo,
      categoria_id: p.categoria_id,
      ativo,
      baixa_ao_ativar: p.baixa_ao_ativar,
    })
    await carregar()
  }

  const clicarPower = async (p) => {
    setErro('')
    if (!p.baixa_ao_ativar) {
      try {
        await trocarAtivo(p, !p.ativo)
      } catch (e) {
        setErro(e.message)
      }
      return
    }

    if (p.ativo) {
      setConfirmando({ produto: p, acao: 'DESATIVAR' })
      return
    }

    try {
      const previa = await api.previaAtivacao(p.id)
      setConfirmando({ produto: p, acao: 'ATIVAR', previa })
    } catch (e) {
      setErro(e.message)
    }
  }

  const confirmar = async () => {
    setAplicando(true)
    setErro('')
    try {
      await trocarAtivo(confirmando.produto, confirmando.acao === 'ATIVAR')
      setConfirmando(null)
    } catch (e) {
      setErro(e.message)
      setConfirmando(null)
    } finally {
      setAplicando(false)
    }
  }

  const excluir = async (p) => {
    if (!window.confirm(`Excluir "${p.nome}" do cardápio? Essa ação não pode ser desfeita.`)) return
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

  const Card = ({ p }) => {
    const faltando = p.baixa_ao_ativar ? faltaEstoque(p) : []
    const bloqueado = !p.ativo && faltando.length > 0 && !p.essencial
    const linhas = fichas[p.id] || []

    return (
      <motion.article
        layout
        className={`prod-card ${p.ativo ? 'on' : ''} ${p.essencial ? 'fixo' : ''} ${bloqueado ? 'blocked' : ''}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="prod-top">
          <div>
            <h4>{p.nome}</h4>
            <div className="prod-meta">
              <span className="chip neutral"><span className="chip-dot" />{p.baixa_ao_ativar ? 'buffet' : p.tipo === 'KG' ? 'por kg' : 'unidade'}</span>
              {!p.baixa_ao_ativar && <span className="prod-preco mono">{brl(p.preco)}{p.tipo === 'KG' ? '/kg' : ''}</span>}
              <span className="muted prod-cat">{p.categoria?.nome || 'sem categoria'}</span>
            </div>
          </div>
          <span className={`chip ${p.essencial ? 'info' : p.ativo ? 'ok' : 'neutral'}`}>
            <span className="chip-dot" />{p.essencial ? 'fixo' : p.ativo ? 'no ar' : 'fora'}
          </span>
        </div>

        {p.baixa_ao_ativar && linhas.length > 0 && (
          <ul className="prod-ficha">
            {linhas.map((l) => {
              const i = insumoNome[l.insumo_id]
              const falta = i && Number(i.qtd_atual) < Number(l.qtd_usada)
              return (
                <li key={l.insumo_id} className={falta ? 'falta' : ''}>
                  <span>{i?.nome || `Item ${l.insumo_id}`}</span>
                  <span className="mono">{num(l.qtd_usada)} {i?.unidade || ''}</span>
                </li>
              )
            })}
          </ul>
        )}

        {bloqueado && (
          <p className="prod-aviso">
            <AlertTriangle size={14} />
            Falta {faltando.map((l) => insumoNome[l.insumo_id]?.nome).join(', ')} no estoque.
          </p>
        )}

        <div className="prod-acoes">
          {p.essencial ? (
            <>
              <span className="prod-fixo">Sempre no cardápio. Dá para mudar o preço na promoção.</span>
              <button className="btn btn-sm btn-ghost" onClick={() => abrirEdicao(p)}><Pencil size={14} /> Editar</button>
            </>
          ) : (
            <>
              <button
                className={`btn btn-sm ${p.ativo ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => clicarPower(p)}
                disabled={bloqueado}
              >
                <Power size={14} /> {p.ativo ? 'Tirar do cardápio' : 'Ativar'}
              </button>
              <button className="btn btn-sm btn-ghost" onClick={() => abrirEdicao(p)}><Pencil size={14} /> Editar</button>
              <button className="btn btn-sm btn-ghost danger" title="Excluir" onClick={() => excluir(p)}><Trash2 size={14} /></button>
            </>
          )}
        </div>
      </motion.article>
    )
  }

  return (
    <div>
      <div className="page-head">
        <div className="eyebrow">Gerência</div>
        <h1>Cardápio</h1>
        <p>Ative o que está no buffet hoje e mantenha as bebidas e porções em dia. Ao ativar um item do buffet, o estoque baixa na hora.</p>
      </div>

      {erro && <p className="form-msg-erro" style={{ marginBottom: 16 }}>{erro}</p>}

      <div className="cardapio-bar">
        <div className="busca">
          <Search size={16} />
          <input placeholder="Buscar no cardápio..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="filtros">
          {FILTROS.map((f) => (
            <button key={f.id} className={`filtro ${filtro === f.id ? 'on' : ''}`} onClick={() => setFiltro(f.id)}>
              {f.nome}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={abrirNovo}><Plus size={16} /> Novo produto</button>
      </div>

      <p className="muted" style={{ fontSize: 13, marginBottom: 18 }}>
        {produtos.length} itens cadastrados · <b style={{ color: 'var(--green)' }}>{ativos} no ar agora</b>
      </p>

      {doBuffet.length > 0 && (
        <section className="cardapio-sec">
          <div className="sec-head">
            <UtensilsCrossed size={16} />
            <h3>Buffet</h3>
            <span className="muted">baixa o estoque ao ativar</span>
          </div>
          <div className="prod-grid">
            {doBuffet.map((p) => <Card key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {paraVenda.length > 0 && (
        <section className="cardapio-sec">
          <div className="sec-head">
            <h3>Para venda</h3>
            <span className="muted">bebidas e porções lançadas na comanda</span>
          </div>
          <div className="prod-grid">
            {paraVenda.map((p) => <Card key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {visiveis.length === 0 && (
        <section className="glass glass-pad">
          <p className="muted" style={{ textAlign: 'center', padding: 20 }}>Nada encontrado com esse filtro.</p>
        </section>
      )}

      <Modal
        open={!!confirmando}
        onClose={() => !aplicando && setConfirmando(null)}
        title={confirmando?.acao === 'ATIVAR' ? 'Mandar pro buffet' : 'Tirar do buffet'}
        subtitle={confirmando?.produto?.nome}
      >
        {confirmando?.acao === 'ATIVAR' ? (
          <div className="stack">
            <p className="muted" style={{ fontSize: 13.5 }}>Ao ativar, isso sai do estoque agora:</p>
            <div className="previa-list">
              {confirmando.previa?.itens.map((i) => (
                <div className={`previa-row ${i.suficiente ? '' : 'falta'}`} key={i.insumo_id}>
                  <span>{i.nome}</span>
                  <span className="row" style={{ gap: 10 }}>
                    <b className="mono">-{num(i.qtd_necessaria)} {i.unidade}</b>
                    <span className="muted mono" style={{ fontSize: 12 }}>
                      {num(i.qtd_atual)} → {num(Math.max(i.qtd_atual - i.qtd_necessaria, 0))} {i.unidade}
                    </span>
                  </span>
                </div>
              ))}
              {!confirmando.previa?.itens.length && (
                <p className="muted" style={{ fontSize: 13 }}>Este item não tem ingredientes ligados, nada sai do estoque.</p>
              )}
            </div>

            {confirmando.previa && !confirmando.previa.pode_ativar && (
              <p className="prod-aviso">
                <AlertTriangle size={14} />
                Não dá pra ativar: falta estoque dos itens em vermelho. Dê entrada no estoque antes.
              </p>
            )}

            <button
              className="btn btn-primary btn-block btn-lg"
              onClick={confirmar}
              disabled={aplicando || (confirmando.previa && !confirmando.previa.pode_ativar)}
            >
              {aplicando ? <Spinner /> : 'Confirmar e baixar do estoque'}
            </button>
          </div>
        ) : (
          <div className="stack">
            <p style={{ fontSize: 14 }}>
              O que já foi pro buffet <b>não volta pro estoque</b>. Isso só tira o item do cardápio de hoje.
            </p>
            <button className="btn btn-danger btn-block btn-lg" onClick={confirmar} disabled={aplicando}>
              {aplicando ? <Spinner /> : 'Tirar do cardápio'}
            </button>
          </div>
        )}
      </Modal>

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
