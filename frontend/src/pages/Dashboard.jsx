import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { brl, fadeUp } from '../lib/ui'

const FORMA_COR = {
  DINHEIRO: '#138a5e',
  DEBITO: '#2f6fd0',
  CREDITO: '#ea1d2c',
  PIX: '#c06a12',
}
const FORMA_LABEL = { DINHEIRO: 'Dinheiro', DEBITO: 'Débito', CREDITO: 'Crédito', PIX: 'Pix' }

const saudacao = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function StatTile({ label, value, sub, dot, delay }) {
  return (
    <motion.div
      className="glass stat"
      style={{ '--sbar': dot }}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
    >
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </motion.div>
  )
}

export default function Dashboard() {
  const { usuario } = useAuth()
  const [d, setD] = useState({ comandas: [], insumos: [], relatorio: null, caixa: null, top: [] })

  useEffect(() => {
    let vivo = true
    const safe = (p) => p.catch(() => null)
    const hoje = new Date().toISOString().slice(0, 10)
    Promise.all([
      safe(api.comandas('ABERTA')),
      safe(api.insumos()),
      safe(api.caixaAtual()),
      safe(api.relatorioProdutos(hoje, hoje, 5)),
    ]).then(async ([comandas, insumos, caixa, top]) => {
      let relatorio = null
      if (caixa) relatorio = await safe(api.relatorioCaixa())
      if (!vivo) return
      setD({
        comandas: comandas || [],
        insumos: insumos || [],
        caixa: caixa || null,
        relatorio,
        top: top || [],
      })
    })
    return () => {
      vivo = false
    }
  }, [])

  const totalComandas = d.comandas.reduce((s, c) => s + Number(c.total || 0), 0)
  const alertas = d.insumos.filter((i) => i.abaixo_do_minimo)
  const vendasDia = d.relatorio?.total_vendido ?? 0
  const fechadas = d.relatorio?.comandas_fechadas ?? 0
  const ticket = fechadas ? vendasDia / fechadas : 0

  const porForma = d.relatorio?.por_forma || {}
  const totalForma = Object.values(porForma).reduce((s, v) => s + Number(v || 0), 0)

  const criticos = [...d.insumos]
    .map((i) => ({
      ...i,
      pct: Math.max(0, Math.min(100, (Number(i.qtd_atual) / Math.max(Number(i.qtd_minima) * 2, 0.001)) * 100)),
    }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 5)

  return (
    <div>
      <div className="page-head">
        <div className="eyebrow">Visão geral</div>
        <h1>{saudacao()}, {usuario.nome?.split(' ')[0]}</h1>
        <p>
          {d.caixa
            ? `Veja o seu restaurante em tempo real. Caixa #${d.caixa.id} aberto agora.`
            : 'Veja o seu restaurante em tempo real. Nenhum caixa aberto no momento.'}
        </p>
      </div>

      <div className="grid kpis" style={{ marginBottom: 18 }}>
        <StatTile label="Vendas do dia" value={brl(vendasDia)} sub={d.caixa ? 'desde a abertura do caixa' : 'abra o caixa para medir'} dot="#138a5e" delay={0.02} />
        <StatTile label="Comandas abertas" value={d.comandas.length} sub={`${brl(totalComandas)} em aberto`} dot="#2f6fd0" delay={0.07} />
        <StatTile label="Ticket médio" value={brl(ticket)} sub="por comanda fechada hoje" dot="#f97316" delay={0.12} />
        <StatTile label="Estoque em alerta" value={alertas.length} sub={alertas.length ? 'repor hoje' : 'tudo em dia'} dot={alertas.length ? '#d92d20' : '#138a5e'} delay={0.17} />
      </div>

      <div className="grid grid-2">
        <motion.div className="glass glass-pad" {...fadeUp}>
          <div className="card-title">
            <h3>Formas de pagamento</h3>
          </div>
          {totalForma > 0 ? (
            <div className="split">
              {Object.entries(porForma)
                .sort((a, b) => b[1] - a[1])
                .map(([forma, valor]) => {
                  const pct = totalForma ? (Number(valor) / totalForma) * 100 : 0
                  return (
                    <div className="split-row" key={forma}>
                      <div className="sl">
                        <span className="nm">
                          <span className="sw" style={{ background: FORMA_COR[forma] }} />
                          {FORMA_LABEL[forma] || forma}
                        </span>
                        <span className="mono muted">{brl(valor)} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="track">
                        <motion.div
                          className="bar"
                          style={{ background: FORMA_COR[forma] }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : (
            <p className="muted" style={{ fontSize: 14 }}>
              Sem vendas registradas ainda. Os valores aparecem aqui conforme as comandas são fechadas.
            </p>
          )}
        </motion.div>

        <motion.div className="glass glass-pad" {...fadeUp}>
          <div className="card-title">
            <h3>Atenção no estoque</h3>
          </div>
          {criticos.length ? (
            <div className="stack" style={{ gap: 15 }}>
              {criticos.map((i) => {
                const cor = i.abaixo_do_minimo ? '#dc2626' : i.pct < 50 ? '#b45309' : '#0a9d6e'
                return (
                  <div className="gauge" key={i.id}>
                    <div className="gl">
                      <span>{i.nome}</span>
                      <span className="mono" style={{ color: cor, fontWeight: 600 }}>
                        {i.qtd_atual} {i.unidade}{i.abaixo_do_minimo ? ' (repor)' : ''}
                      </span>
                    </div>
                    <div className="track">
                      <motion.div
                        className="bar"
                        style={{ background: cor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(6, i.pct)}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="muted" style={{ fontSize: 14 }}>Sem dados de estoque disponíveis para o seu perfil.</p>
          )}
        </motion.div>
      </div>

      {d.top.length > 0 && (
        <motion.div className="glass glass-pad" style={{ marginTop: 18 }} {...fadeUp}>
          <div className="card-title">
            <h3>Mais vendidos hoje</h3>
          </div>
          <div className="split">
            {d.top.map((p) => {
              const max = Math.max(...d.top.map((x) => x.receita), 1)
              return (
                <div className="split-row" key={p.produto_id}>
                  <div className="sl">
                    <span className="nm">{p.produto_nome}</span>
                    <span className="mono muted">{brl(p.receita)} em {p.quantidade} un</span>
                  </div>
                  <div className="track">
                    <motion.div className="bar" style={{ background: '#ea1d2c' }} initial={{ width: 0 }} animate={{ width: `${Math.max(4, (p.receita / max) * 100)}%` }} transition={{ duration: 0.6 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}
