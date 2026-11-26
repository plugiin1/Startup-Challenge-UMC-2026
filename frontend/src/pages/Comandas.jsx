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
import { brl, Empty, Modal, Spinner } from '../lib/ui'

const FORMAS = [
  { id: 'DINHEIRO', nome: 'Dinheiro', icon: Banknote },
  { id: 'DEBITO', nome: 'Débito', icon: CreditCard },
  { id: 'CREDITO', nome: 'Crédito', icon: Landmark },
  { id: 'PIX', nome: 'Pix', icon: QrCode },
]
const TAGS_RAPIDAS = ['Com gelo', 'Com limão', 'Com laranja']

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

function ItemModal({ produto, marmitexPreco, onClose, onConfirm, enviando }) {
  const [qtd, setQtd] = useState(1)
  const [peso, setPeso] = useState('')
  const [tags, setTags] = useState([])
  const [texto, setTexto] = useState('')
  const [marmitex, setMarmitex] = useState(false)

  const kg = produto?.tipo === 'KG'
  const ehBebida = produto?.categoria?.nome === 'Bebidas'
  const toggleTag = (t) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))

  useEffect(() => {
    if (produto) {
      setQtd(1)
      setPeso('')
      setTags([])
      setTexto('')
      setMarmitex(false)
    }
  }, [produto])

  const obsFinal = [...tags, texto.trim()].filter(Boolean).join(', ')
  const base = produto ? (kg ? Number(peso || 0) * Number(produto.preco) : qtd * Number(produto.preco)) : 0
  const subtotal = base + (marmitex ? Number(marmitexPreco || 0) : 0)

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

      {ehBebida && (
        <>
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
        </>
      )}

      {kg && marmitexPreco != null && (
        <button
          type="button"
          className={`opt-toggle ${marmitex ? 'on' : ''}`}
          style={{ marginTop: 14 }}
          onClick={() => setMarmitex((v) => !v)}
        >
          <span>
            <b>Levar em marmitex</b>
            <small>{marmitex ? 'embalagem incluída, toque para remover' : 'toque para adicionar a embalagem'}</small>
          </span>
          <span className="mono">+ {brl(marmitexPreco)}</span>
        </button>
      )}

      <button
        className="btn btn-primary btn-lg btn-block"
        style={{ marginTop: 18 }}
        disabled={enviando || (kg && !Number(peso))}
        onClick={() => onConfirm({ qtd, peso, observacao: obsFinal, marmitex })}
      >
        {enviando ? <Spinner /> : <><Plus size={17} /> Adicionar {brl(subtotal)}</>}
      </button>
    </Modal>
  )
}

function PaymentModal({ open, comanda, onClose, onConfirm, fechando }) {
  const totalDevido = r2(comanda?.total || 0)
  const [linhas, setLinhas] = useState([{ forma: 'PIX', valor: '' }])

  useEffect(() => {
    if (open) setLinhas([{ forma: 'PIX', valor: totalDevido.toFixed(2) }])
  }, [open, totalDevido])

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
    onConfirm(pagamentos)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Fechar comanda"
      subtitle={comanda ? comanda.cliente : ''}
    >
      <div className="pay-sum">
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
  const [nome, setNome] = useState('')
  const [tel, setTel] = useState('')
  const [pedirTel, setPedirTel] = useState(false)
  const [erro, setErro] = useState('')

  const [busca, setBusca] = useState('')
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
  }, [])

  const buffetProd = useMemo(() => produtos.find((p) => !p.baixa_ao_ativar && p.tipo === 'KG'), [produtos])
  const marmitexProd = useMemo(() => produtos.find((p) => /marmitex|embalagem/i.test(p.nome)), [produtos])
  const destaques = useMemo(() => [buffetProd].filter(Boolean), [buffetProd])

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase()
    const ocultos = new Set(destaques.map((p) => p.id))
    if (marmitexProd) ocultos.add(marmitexProd.id)
    return produtos.filter((p) => {
      if (p.baixa_ao_ativar || ocultos.has(p.id)) return false
      return !q || p.nome.toLowerCase().includes(q)
    })
  }, [produtos, busca, destaques, marmitexProd])

  const abrirComandaNova = async (e) => {
    e.preventDefault()
    setErro('')
    if (pedirTel && !tel.trim()) {
      setErro('Informe o telefone para diferenciar os clientes com o mesmo nome.')
      return
    }
    try {
      const nova = await api.abrirComanda(nome.trim(), tel.trim() || null)
      setNome('')
      setTel('')
      setPedirTel(false)
      await carregar()
      setAtiva(nova)
    } catch (err) {
      if (err.code === 'TELEFONE_NECESSARIO') {
        setPedirTel(true)
        setErro(err.message)
      } else {
        setErro(err.message)
      }
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
      setErro('Selecione ou abra uma comanda antes de lançar itens.')
      return
    }
    setErro('')
    setSelecionado(p)
  }

  const confirmarItem = async ({ qtd, peso, observacao, marmitex }) => {
    setAddLoad(true)
    try {
      await api.lancarItem(ativa.id, {
        produto_id: selecionado.id,
        qtd: Number(qtd),
        peso_kg: peso ? Number(peso) : null,
        observacao: observacao || null,
      })
      if (marmitex && marmitexProd) {
        await api.lancarItem(ativa.id, { produto_id: marmitexProd.id, qtd: 1, peso_kg: null, observacao: null })
      }
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

  const confirmarPagamento = async (pagamentos) => {
    setFechando(true)
    setErro('')
    try {
      await api.fecharComanda(ativa.id, pagamentos)
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
        <p>Abra a comanda no nome do cliente, toque no produto e defina a quantidade e as observações.</p>
      </div>

      <div className="pos-tables">
        {comandas.map((c) => (
          <button key={c.id} className={`table-chip ${ativa?.id === c.id ? 'on' : ''}`} onClick={() => selecionarMesa(c.id)}>
            <b>{c.cliente}</b>
            <span>{c.telefone ? `${brl(c.total)} (${c.telefone})` : brl(c.total)}</span>
          </button>
        ))}
        <form className="table-new" onSubmit={abrirComandaNova}>
          <input
            placeholder="Nome e sobrenome"
            value={nome}
            onChange={(e) => { setNome(e.target.value); if (pedirTel) { setPedirTel(false); setTel('') } }}
            required
            minLength={2}
          />
          {pedirTel && (
            <input placeholder="Telefone" value={tel} onChange={(e) => setTel(e.target.value)} autoFocus />
          )}
          <button className="btn btn-primary btn-sm"><Plus size={16} /> Abrir</button>
        </form>
      </div>

      {erro && <p className="form-msg-erro" style={{ marginBottom: 16 }}>{erro}</p>}

      <div className="pos-grid">
        <section className="glass glass-pad">
          {destaques.length > 0 && (
            <div className="quick-actions">
              {destaques.map((p) => (
                <button key={p.id} className="quick-btn" onClick={() => escolherProduto(p)}>
                  <b>{p.nome}</b>
                  <span>{p.tipo === 'KG' ? `${brl(p.preco)}/kg` : brl(p.preco)}</span>
                </button>
              ))}
            </div>
          )}
          <div className="menu-toolbar">
            <div className="search-box">
              <Search size={17} />
              <input placeholder="Buscar produto..." value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
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
            <Empty icon={Receipt}>Selecione ou abra uma comanda no nome do cliente.</Empty>
          ) : (
            <motion.div key={ativa.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="order-head">
                <div>
                  <h3>{ativa.cliente}</h3>
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

      <ItemModal produto={selecionado} marmitexPreco={marmitexProd ? Number(marmitexProd.preco) : null} enviando={addLoad} onClose={() => !addLoad && setSelecionado(null)} onConfirm={confirmarItem} />

      <PaymentModal
        open={pagando}
        comanda={ativa}
        fechando={fechando}
        onClose={() => !fechando && setPagando(false)}
        onConfirm={confirmarPagamento}
      />

      <Modal
        open={confirmCancel}
        onClose={() => !cancelando && setConfirmCancel(false)}
        title="Cancelar comanda"
        subtitle={ativa ? `${ativa.cliente}. Isso remove todos os itens e devolve os insumos ao estoque.` : ''}
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
