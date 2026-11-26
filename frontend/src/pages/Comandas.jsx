import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Minus,
  Search,
  Receipt,
  Trash2,
  XCircle,
  Banknote,
  CreditCard,
  Landmark,
  QrCode,
  CheckCircle2,
} from 'lucide-react'
import { api } from '../services/api'
import { brl, Empty, Modal, Spinner, mesaLabel } from '../lib/ui'

const FORMAS = [
  { id: 'DINHEIRO', nome: 'Dinheiro', icon: Banknote },
  { id: 'DEBITO', nome: 'Débito', icon: CreditCard },
  { id: 'CREDITO', nome: 'Crédito', icon: Landmark },
  { id: 'PIX', nome: 'Pix', icon: QrCode },
]
const STATUS_CHIP = { RECEBIDO: 'neutral', PREPARANDO: 'warn', PRONTO: 'ok', ENTREGUE: 'info' }
const TAGS_RAPIDAS = [
  'Sem cebola',
  'Sem gelo',
  'Com gelo',
  'Com limão',
  'Bem passado',
  'Sem pimenta',
  'Sem açúcar',
  'Para viagem',
]

const r2 = (v) => Math.round((Number(v) || 0) * 100) / 100

function QtyStepper({ value, onChange }) {
  return (
    <div className="qty-stepper">
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))}>
        <Minus size={16} />
      </button>
      <span className="qv">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)}>
        <Plus size={16} />
      </button>
    </div>
  )
}

function ItemModal({ produto, onClose, onConfirm, enviando }) {
  const [qtd, setQtd] = useState(1)
  const [peso, setPeso] = useState('')
  const [tags, setTags] = useState([])
  const [texto, setTexto] = useState('')

  const kg = produto?.tipo === 'KG'
  const toggleTag = (t) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))

  const obsFinal = [...tags, texto.trim()].filter(Boolean).join(', ')
  const subtotal = produto ? (kg ? Number(peso || 0) * Number(produto.preco) : qtd * Number(produto.preco)) : 0

  return (
    <Modal
      open={!!produto}
      onClose={onClose}
      title={produto?.nome}
      subtitle={`${brl(produto?.preco)}${kg ? '/kg' : ' por unidade'}`}
    >
      {kg ? (
        <label className="field" style={{ marginBottom: 16 }}>
          Peso (kg)
          <input type="number" step="0.001" min="0" placeholder="0,000" value={peso} onChange={(e) => setPeso(e.target.value)} autoFocus />
        </label>
      ) : (
        <div className="row spread" style={{ marginBottom: 16 }}>
          <span className="field" style={{ textTransform: 'none' }}>Quantidade</span>
          <QtyStepper value={qtd} onChange={setQtd} />
        </div>
      )}

      <div className="field" style={{ marginBottom: 8 }}>Observações</div>
      <div className="tag-row">
        {TAGS_RAPIDAS.map((t) => (
          <button key={t} type="button" className={`tag-opt ${tags.includes(t) ? 'on' : ''}`} onClick={() => toggleTag(t)}>
            {t}
          </button>
        ))}
      </div>
      <textarea
        rows={2}
        placeholder="Outro detalhe (ex: coca com gelo e limão espremido)"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        style={{ marginTop: 10, resize: 'vertical' }}
      />

      <button
        className="btn btn-primary btn-lg btn-block"
        style={{ marginTop: 18 }}
        disabled={enviando || (kg && !Number(peso))}
        onClick={() => onConfirm({ qtd, peso, observacao: obsFinal })}
      >
        {enviando ? <Spinner /> : <><Plus size={17} /> Adicionar {brl(subtotal)}</>}
      </button>
    </Modal>
  )
}

function PaymentModal({ open, comanda, taxaPercent, onClose, onConfirm, fechando }) {
  const subtotal = Number(comanda?.total || 0)
  const [aplicarTaxa, setAplicarTaxa] = useState(true)
  const [linhas, setLinhas] = useState([{ forma: 'PIX', valor: '' }])

  const taxa = aplicarTaxa ? r2((subtotal * taxaPercent) / 100) : 0
  const totalDevido = r2(subtotal + taxa)

  useEffect(() => {
    if (open) {
      const total = r2(subtotal + r2((subtotal * taxaPercent) / 100))
      setAplicarTaxa(true)
      setLinhas([{ forma: 'PIX', valor: total.toFixed(2) }])
    }
  }, [open, subtotal, taxaPercent])

  const alternarTaxa = () => {
    const nova = !aplicarTaxa
    setAplicarTaxa(nova)
    const novoTotal = r2(subtotal + (nova ? r2((subtotal * taxaPercent) / 100) : 0))
    if (linhas.length === 1) setLinhas([{ ...linhas[0], valor: novoTotal.toFixed(2) }])
  }

  const soma = r2(linhas.reduce((s, l) => s + Number(l.valor || 0), 0))
  const falta = r2(totalDevido - soma)
  const ok = Math.abs(falta) < 0.01 && soma > 0

  const setLinha = (i, patch) => setLinhas((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  const addLinha = () => setLinhas((ls) => [...ls, { forma: 'DINHEIRO', valor: Math.max(0, falta).toFixed(2) }])
  const rmLinha = (i) => setLinhas((ls) => (ls.length > 1 ? ls.filter((_, idx) => idx !== i) : ls))

  const confirmar = () => {
    const pagamentos = linhas
      .map((l) => ({ forma: l.forma, valor: r2(l.valor) }))
      .filter((p) => p.valor > 0)
    onConfirm(pagamentos, aplicarTaxa)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Fechar comanda"
      subtitle={comanda ? mesaLabel(comanda.mesa) : ''}
    >
      <div className="pay-sum">
        <div className="row spread"><span className="muted">Subtotal</span><span className="mono">{brl(subtotal)}</span></div>
        <button type="button" className={`taxa-toggle ${aplicarTaxa ? 'on' : ''}`} onClick={alternarTaxa}>
          <span>
            <b>Taxa de serviço ({taxaPercent}%)</b>
            <small>{aplicarTaxa ? 'incluída, toque para remover' : 'removida, toque para incluir'}</small>
          </span>
          <span className="mono">{aplicarTaxa ? brl(taxa) : brl(0)}</span>
        </button>
        <div className="row spread pay-total"><span>Total a pagar</span><b className="mono">{brl(totalDevido)}</b></div>
      </div>

      <div className="field" style={{ margin: '4px 0 8px' }}>Pagamento</div>
      <div className="stack" style={{ gap: 8 }}>
        {linhas.map((l, i) => (
          <div className="pay-line" key={i}>
            <select value={l.forma} onChange={(e) => setLinha(i, { forma: e.target.value })}>
              {FORMAS.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
            <input
              type="number"
              step="0.01"
              min="0"
              value={l.valor}
              onChange={(e) => setLinha(i, { valor: e.target.value })}
            />
            {linhas.length > 1 && (
              <button className="oi-remove" onClick={() => rmLinha(i)} title="Remover forma"><Trash2 size={15} /></button>
            )}
          </div>
        ))}
      </div>
      <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={addLinha}>
        <Plus size={15} /> Dividir em outra forma
      </button>

      <div className={`pay-falta ${ok ? 'ok' : ''}`}>
        {Math.abs(falta) < 0.01 ? 'Valor exato' : falta > 0 ? `Falta ${brl(falta)}` : `Passou ${brl(-falta)}`}
      </div>

      <button className="btn btn-primary btn-lg btn-block" onClick={confirmar} disabled={fechando || !ok}>
        {fechando ? <Spinner /> : <><CheckCircle2 size={18} /> Confirmar {brl(totalDevido)}</>}
      </button>
    </Modal>
  )
}

export default function Comandas() {
  const [comandas, setComandas] = useState([])
  const [produtos, setProdutos] = useState([])
  const [ativa, setAtiva] = useState(null)
  const [mesa, setMesa] = useState('')
  const [erro, setErro] = useState('')
  const [taxaPercent, setTaxaPercent] = useState(10)

  const [busca, setBusca] = useState('')
  const [cat, setCat] = useState('Todos')
  const [selecionado, setSelecionado] = useState(null)
  const [addLoad, setAddLoad] = useState(false)

  const [pagando, setPagando] = useState(false)
  const [fechando, setFechando] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelando, setCancelando] = useState(false)

  const carregar = async () => {
    try {
      setComandas(await api.comandas('ABERTA'))
    } catch (e) {
      setErro(e.message)
    }
  }

  useEffect(() => {
    carregar()
    api.produtos().then(setProdutos).catch((e) => setErro(e.message))
    api.config().then((c) => setTaxaPercent(Number(c.taxa_servico_percent))).catch(() => {})
  }, [])

  const categorias = useMemo(() => {
    const nomes = new Set(produtos.map((p) => p.categoria?.nome).filter(Boolean))
    return ['Todos', ...nomes]
  }, [produtos])

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return produtos.filter((p) => {
      const okCat = cat === 'Todos' || p.categoria?.nome === cat
      const okBusca = !q || p.nome.toLowerCase().includes(q)
      return okCat && okBusca
    })
  }, [produtos, busca, cat])

  const abrirMesa = async (e) => {
    e.preventDefault()
    setErro('')
    try {
      const nova = await api.abrirComanda(mesa, null)
      setMesa('')
      await carregar()
      setAtiva(nova)
    } catch (err) {
      setErro(err.message)
    }
  }

  const selecionarMesa = async (id) => {
    setErro('')
    try {
      setAtiva(await api.comanda(id))
    } catch (e) {
      setErro(e.message)
    }
  }

  const escolherProduto = (p) => {
    if (!ativa) {
      setErro('Selecione ou abra uma mesa antes de lançar itens.')
      return
    }
    setErro('')
    setSelecionado(p)
  }

  const confirmarItem = async ({ qtd, peso, observacao }) => {
    setAddLoad(true)
    try {
      await api.lancarItem(ativa.id, {
        produto_id: selecionado.id,
        qtd: Number(qtd),
        peso_kg: peso ? Number(peso) : null,
        observacao: observacao || null,
      })
      setSelecionado(null)
      await selecionarMesa(ativa.id)
      await carregar()
    } catch (err) {
      setErro(err.message)
    } finally {
      setAddLoad(false)
    }
  }

  const removerItem = async (itemId) => {
    setErro('')
    try {
      await api.removerItem(ativa.id, itemId)
      await selecionarMesa(ativa.id)
      await carregar()
    } catch (err) {
      setErro(err.message)
    }
  }

  const cancelarComanda = async () => {
    setCancelando(true)
    setErro('')
    try {
      await api.cancelarComanda(ativa.id)
      setConfirmCancel(false)
      setAtiva(null)
      await carregar()
    } catch (err) {
      setErro(err.message)
    } finally {
      setCancelando(false)
    }
  }

  const confirmarPagamento = async (pagamentos, aplicarTaxa) => {
    setFechando(true)
    setErro('')
    try {
      await api.fecharComanda(ativa.id, pagamentos, aplicarTaxa)
      setPagando(false)
      setAtiva(null)
      await carregar()
    } catch (err) {
      setErro(err.message)
    } finally {
      setFechando(false)
    }
  }

  return (
    <div>
      <div className="page-head">
        <div className="eyebrow">Salão</div>
        <h1>Comandas</h1>
        <p>Escolha a mesa, toque no produto e defina a quantidade e as observações.</p>
      </div>

      <div className="pos-tables">
        {comandas.map((c) => (
          <button key={c.id} className={`table-chip ${ativa?.id === c.id ? 'on' : ''}`} onClick={() => selecionarMesa(c.id)}>
            <b>{mesaLabel(c.mesa)}</b>
            <span>{brl(c.total)}</span>
          </button>
        ))}
        <form className="table-new" onSubmit={abrirMesa}>
          <input placeholder="Nº da mesa" value={mesa} onChange={(e) => setMesa(e.target.value)} required />
          <button className="btn btn-primary btn-sm"><Plus size={16} /> Abrir</button>
        </form>
      </div>

      {erro && <p className="form-msg-erro" style={{ marginBottom: 16 }}>{erro}</p>}

      <div className="pos-grid">
        <section className="glass glass-pad">
          <div className="menu-toolbar">
            <div className="search-box">
              <Search size={17} />
              <input placeholder="Buscar produto..." value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
          </div>
          <div className="cat-chips">
            {categorias.map((c) => (
              <button key={c} className={`cat-chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>
                {c}
              </button>
            ))}
          </div>

          {visiveis.length ? (
            <div className="menu-grid">
              {visiveis.map((p) => (
                <motion.button key={p.id} layout whileTap={{ scale: 0.97 }} className="prod-card" onClick={() => escolherProduto(p)}>
                  <span className="pn">{p.nome}</span>
                  <span className="pbottom">
                    <span className="pp">{brl(p.preco)}</span>
                    {p.tipo === 'KG' && <span className="ptag">por kg</span>}
                  </span>
                </motion.button>
              ))}
            </div>
          ) : (
            <Empty icon={Search}>Nenhum produto encontrado.</Empty>
          )}
        </section>

        <section className="glass glass-pad order-panel">
          {!ativa ? (
            <Empty icon={Receipt}>Selecione uma mesa para começar a comanda.</Empty>
          ) : (
            <motion.div key={ativa.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="order-head">
                <div>
                  <h3>{mesaLabel(ativa.mesa)}</h3>
                  <span className="faint" style={{ fontSize: 12 }}>Comanda #{ativa.id}</span>
                </div>
                <span className="badge">{ativa.itens?.length || 0} itens</span>
              </div>

              {ativa.itens?.length ? (
                <div className="order-items">
                  {ativa.itens.map((i) => (
                    <div className="order-item" key={i.id}>
                      <div className="oi-main">
                        <b>{i.peso_kg ? `${i.peso_kg} kg` : `${i.qtd}×`} {i.produto_nome}</b>
                        {i.observacao && <small>{i.observacao}</small>}
                        <span className={`chip ${STATUS_CHIP[i.status_cozinha] || 'neutral'}`} style={{ marginTop: 4 }}>
                          <span className="chip-dot" />{i.status_cozinha}
                        </span>
                      </div>
                      <div className="oi-right">
                        <span className="oi-val mono">{brl(i.subtotal)}</span>
                        <button className="oi-remove" title="Remover item" onClick={() => removerItem(i.id)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted" style={{ fontSize: 14, padding: '10px 0' }}>
                  Nenhum item ainda. Toque num produto do cardápio ao lado.
                </p>
              )}

              <div className="total-line">
                <span>Subtotal</span>
                <b>{brl(ativa.total)}</b>
              </div>
              <button className="btn btn-primary btn-lg btn-block" style={{ marginTop: 14 }} disabled={!ativa.itens?.length} onClick={() => setPagando(true)}>
                <Receipt size={18} /> Fechar comanda
              </button>
              <button className="btn btn-danger btn-block" style={{ marginTop: 10 }} onClick={() => setConfirmCancel(true)}>
                <XCircle size={17} /> Cancelar comanda
              </button>
            </motion.div>
          )}
        </section>
      </div>

      <ItemModal produto={selecionado} enviando={addLoad} onClose={() => !addLoad && setSelecionado(null)} onConfirm={confirmarItem} />

      <PaymentModal
        open={pagando}
        comanda={ativa}
        taxaPercent={taxaPercent}
        fechando={fechando}
        onClose={() => !fechando && setPagando(false)}
        onConfirm={confirmarPagamento}
      />

      <Modal
        open={confirmCancel}
        onClose={() => !cancelando && setConfirmCancel(false)}
        title="Cancelar comanda"
        subtitle={ativa ? `${mesaLabel(ativa.mesa)}. Isso remove todos os itens e devolve os insumos ao estoque.` : ''}
      >
        <div className="row" style={{ gap: 10 }}>
          <button className="btn btn-block" onClick={() => setConfirmCancel(false)} disabled={cancelando}>Voltar</button>
          <button className="btn btn-danger btn-block" onClick={cancelarComanda} disabled={cancelando}>
            {cancelando ? <Spinner className="dark" /> : <><XCircle size={17} /> Cancelar</>}
          </button>
        </div>
      </Modal>
    </div>
  )
}
