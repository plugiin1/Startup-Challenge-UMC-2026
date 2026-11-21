import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Inbox } from 'lucide-react'
import { api } from '../services/api'
import { Empty, mesaLabel } from '../lib/ui'

const PROXIMO = { RECEBIDO: 'PREPARANDO', PREPARANDO: 'PRONTO', PRONTO: 'ENTREGUE' }
const ROTULO = { RECEBIDO: 'Iniciar preparo', PREPARANDO: 'Marcar pronto', PRONTO: 'Entregar' }
const COLUNAS = [
  { id: 'RECEBIDO', nome: 'Recebido', cor: '#4a90d9' },
  { id: 'PREPARANDO', nome: 'Preparando', cor: '#f97316' },
  { id: 'PRONTO', nome: 'Pronto', cor: '#37d399' },
]

const minutosDe = (iso) => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
const fmtTempo = (min) =>
  min < 60 ? `${min} min` : `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`

export default function Cozinha() {
  const [pedidos, setPedidos] = useState([])
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    try {
      setPedidos(await api.pedidosCozinha())
      setErro('')
    } catch (e) {
      setErro(e.message)
    }
  }, [])

  useEffect(() => {
    carregar()
    const timer = setInterval(carregar, 5000)
    return () => clearInterval(timer)
  }, [carregar])

  const avancar = async (pedido) => {
    try {
      await api.mudarStatusItem(pedido.item_id, PROXIMO[pedido.status_cozinha])
      await carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <div>
      <div className="page-head">
        <div className="eyebrow">Cozinha</div>
        <h1>Painel da cozinha</h1>
        <p>Os pedidos chegam aqui na hora e o painel se atualiza sozinho. Sem papel, sem comanda perdida.</p>
      </div>

      {erro && <p className="form-msg-erro" style={{ marginBottom: 16 }}>{erro}</p>}

      <div className="kds">
        <div className="kds-head">
          <span className="chip ok">
            <span className="chip-dot" /> ao vivo
          </span>
          <span className="muted" style={{ fontSize: 13 }}>
            {pedidos.length} {pedidos.length === 1 ? 'item' : 'itens'} na fila
          </span>
        </div>

        <div className="kanban">
          {COLUNAS.map((col) => {
            const lista = pedidos.filter((p) => p.status_cozinha === col.id)
            return (
              <section key={col.id} className="kcol">
                <div className="kcol-head">
                  <span className="t">
                    <span className="dot" style={{ background: col.cor }} /> {col.nome}
                  </span>
                  <span className="badge">{lista.length}</span>
                </div>

                <AnimatePresence initial={false}>
                  {lista.map((p) => {
                    const min = minutosDe(p.criado_em)
                    const atrasado = min > 15
                    return (
                      <motion.article
                        key={p.item_id}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                        className={`kcard ${atrasado ? 'late' : ''}`}
                        style={{ '--kcolor': col.cor }}
                      >
                        <div className="khead">
                          <strong>{mesaLabel(p.mesa)}</strong>
                          <span className={`timer ${atrasado ? 'danger' : ''}`}>
                            <Clock size={13} /> {fmtTempo(min)}
                          </span>
                        </div>
                        <div className="kname">
                          {p.qtd}× {p.produto_nome}
                        </div>
                        {p.observacao && <div className="kobs">“{p.observacao}”</div>}
                        <button className="kds-btn" style={{ '--kcolor': col.cor }} onClick={() => avancar(p)}>
                          {ROTULO[p.status_cozinha]}
                        </button>
                      </motion.article>
                    )
                  })}
                </AnimatePresence>

                {lista.length === 0 && <Empty icon={Inbox}>Nada por aqui.</Empty>}
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
