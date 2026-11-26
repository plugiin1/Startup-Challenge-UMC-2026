import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../services/api'
import { brl, fadeUp } from '../lib/ui'

const hoje = () => new Date().toISOString().slice(0, 10)
const diasAtras = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)
const FORMA_COR = { DINHEIRO: '#15705a', DEBITO: '#1f5d7a', CREDITO: '#6e1a15', PIX: '#a9711a' }
const FORMA_LABEL = { DINHEIRO: 'Dinheiro', DEBITO: 'Débito', CREDITO: 'Crédito', PIX: 'Pix' }
const fmtDia = (iso) => iso.slice(8, 10) + '/' + iso.slice(5, 7)

export default function Relatorios() {
  const [inicio, setInicio] = useState(diasAtras(6))
  const [fim, setFim] = useState(hoje())
  const [vendas, setVendas] = useState(null)
  const [produtos, setProdutos] = useState([])
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const buscar = async () => {
    setErro('')
    setCarregando(true)
    try {
      const [v, p] = await Promise.all([
        api.relatorioVendas(inicio, fim),
        api.relatorioProdutos(inicio, fim, 10),
      ])
      setVendas(v)
      setProdutos(p)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    buscar()
  }, [])

  const totalForma = vendas ? Object.values(vendas.por_forma).reduce((s, v) => s + v, 0) : 0
  const maxDia = vendas && vendas.por_dia.length ? Math.max(...vendas.por_dia.map((d) => d.total)) : 1
  const maxProd = produtos.length ? Math.max(...produtos.map((p) => p.receita)) : 1

  return (
    <div>
      <div className="page-head">
        <div className="eyebrow">Gerência</div>
        <h1>Relatórios</h1>
        <p>Vendas por período e os produtos que mais faturam.</p>
      </div>

      <div className="row wrap" style={{ marginBottom: 18, gap: 12, alignItems: 'flex-end' }}>
        <label className="field" style={{ width: 160 }}>
          De
          <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </label>
        <label className="field" style={{ width: 160 }}>
          Até
          <input type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
        </label>
        <button className="btn btn-primary" onClick={buscar} disabled={carregando}>Aplicar</button>
      </div>

      {erro && <p className="form-msg-erro" style={{ marginBottom: 16 }}>{erro}</p>}

      {vendas && (
        <>
          <div className="grid kpis" style={{ marginBottom: 18 }}>
            <motion.div className="glass stat" style={{ '--sbar': '#15705a' }} {...fadeUp}>
              <div className="label">Total vendido</div>
              <div className="value">{brl(vendas.total_vendido)}</div>
            </motion.div>
            <motion.div className="glass stat" style={{ '--sbar': '#1f5d7a' }} {...fadeUp}>
              <div className="label">Comandas</div>
              <div className="value">{vendas.comandas}</div>
            </motion.div>
            <motion.div className="glass stat" style={{ '--sbar': '#6e1a15' }} {...fadeUp}>
              <div className="label">Ticket médio</div>
              <div className="value">{brl(vendas.ticket_medio)}</div>
            </motion.div>
            <motion.div className="glass stat" style={{ '--sbar': '#c2601f' }} {...fadeUp}>
              <div className="label">Dias no período</div>
              <div className="value">{vendas.por_dia.length}</div>
            </motion.div>
          </div>

          <div className="grid grid-2">
            <motion.div className="glass glass-pad" {...fadeUp}>
              <div className="card-title"><h3>Por forma de pagamento</h3></div>
              {totalForma > 0 ? (
                <div className="split">
                  {Object.entries(vendas.por_forma).sort((a, b) => b[1] - a[1]).map(([forma, valor]) => {
                    const pct = totalForma ? (valor / totalForma) * 100 : 0
                    return (
                      <div className="split-row" key={forma}>
                        <div className="sl">
                          <span className="nm"><span className="sw" style={{ background: FORMA_COR[forma] }} />{FORMA_LABEL[forma]}</span>
                          <span className="mono muted">{brl(valor)} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="track"><div className="bar" style={{ width: `${pct}%`, background: FORMA_COR[forma] }} /></div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="muted" style={{ fontSize: 14 }}>Sem vendas no período.</p>
              )}
            </motion.div>

            <motion.div className="glass glass-pad" {...fadeUp}>
              <div className="card-title"><h3>Vendas por dia</h3></div>
              {vendas.por_dia.length ? (
                <div className="split">
                  {vendas.por_dia.map((d) => (
                    <div className="split-row" key={d.dia}>
                      <div className="sl">
                        <span className="nm">{fmtDia(d.dia)}</span>
                        <span className="mono muted">{brl(d.total)} ({d.comandas})</span>
                      </div>
                      <div className="track"><div className="bar" style={{ width: `${Math.max(4, (d.total / maxDia) * 100)}%`, background: '#6e1a15' }} /></div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted" style={{ fontSize: 14 }}>Sem vendas no período.</p>
              )}
            </motion.div>
          </div>

          <motion.div className="glass glass-pad" style={{ marginTop: 18 }} {...fadeUp}>
            <div className="card-title"><h3>Produtos mais vendidos</h3></div>
            {produtos.length ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr><th>Produto</th><th className="num">Quantidade</th><th className="num">Receita</th><th style={{ width: '32%' }}></th></tr>
                  </thead>
                  <tbody>
                    {produtos.map((p) => (
                      <tr key={p.produto_id}>
                        <td>{p.produto_nome}</td>
                        <td className="num mono">{p.quantidade}</td>
                        <td className="num mono">{brl(p.receita)}</td>
                        <td>
                          <div className="track"><div className="bar" style={{ width: `${Math.max(4, (p.receita / maxProd) * 100)}%`, background: '#c2601f' }} /></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted" style={{ fontSize: 14 }}>Nenhuma venda no período.</p>
            )}
          </motion.div>
        </>
      )}
    </div>
  )
}
