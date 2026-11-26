import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Wallet, Unlock, Lock, Banknote, CreditCard } from 'lucide-react'
import { api } from '../services/api'
import { brl, fadeUp, Spinner } from '../lib/ui'

const FORMA_LABEL = { DINHEIRO: 'Dinheiro', DEBITO: 'Débito', CREDITO: 'Crédito', PIX: 'Pix' }
const FORMA_COR = { DINHEIRO: '#15705a', DEBITO: '#1f5d7a', CREDITO: '#6e1a15', PIX: '#a9711a' }

function DiffChip({ valor }) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return null
  const v = Math.round(valor * 100) / 100
  if (Math.abs(v) < 0.01) return <span className="chip ok"><span className="chip-dot" /> bateu certo</span>
  if (v > 0) return <span className="chip" style={{ color: '#a9711a' }}><span className="chip-dot" /> sobrou {brl(v)}</span>
  return <span className="chip danger"><span className="chip-dot" /> faltou {brl(-v)}</span>
}

export default function Caixa() {
  const [caixa, setCaixa] = useState(null)
  const [relatorio, setRelatorio] = useState(null)
  const [fechado, setFechado] = useState(null)
  const [valorInicial, setValorInicial] = useState('0')
  const [contado, setContado] = useState('')
  const [maquininhas, setMaquininhas] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const carregar = async () => {
    try {
      const atual = await api.caixaAtual()
      setCaixa(atual)
      setRelatorio(atual ? await api.relatorioCaixa() : null)
      setErro('')
    } catch (e) {
      setErro(e.message)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const abrir = async (e) => {
    e.preventDefault()
    setCarregando(true)
    try {
      await api.abrirCaixa(Number(valorInicial))
      setFechado(null)
      await carregar()
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  const fechar = async (e) => {
    e.preventDefault()
    setCarregando(true)
    try {
      const resultado = await api.fecharCaixa({
        valor_contado: Number(contado),
        valor_maquininhas: Number(maquininhas || 0),
      })
      setFechado(resultado)
      setCaixa(null)
      setRelatorio(null)
      setContado('')
      setMaquininhas('')
      setErro('')
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  const esperadoGaveta = relatorio ? Number(relatorio.dinheiro_esperado) : Number(caixa?.valor_inicial || 0)
  const esperadoCartao = relatorio ? Number(relatorio.cartao_pix_sistema) : 0
  const difGaveta = contado === '' ? null : Number(contado) - esperadoGaveta
  const difMaq = maquininhas === '' ? null : Number(maquininhas) - esperadoCartao

  return (
    <div>
      <div className="page-head">
        <div className="eyebrow">Financeiro</div>
        <h1>Caixa</h1>
        <p>Abra o caixa com o troco, receba as comandas e feche conferindo a gaveta com as maquininhas.</p>
      </div>

      {erro && <p className="form-msg-erro" style={{ marginBottom: 16 }}>{erro}</p>}

      {!caixa && (
        <motion.section className="glass glass-pad" style={{ maxWidth: 460 }} {...fadeUp}>
          <div className="card-title">
            <span className="ico"><Wallet /></span>
            <h3>Abrir o caixa</h3>
          </div>
          {fechado && (
            <div className="chip ok" style={{ marginBottom: 14 }}>
              <span className="chip-dot" /> Caixa anterior fechado
            </div>
          )}
          <form className="stack" onSubmit={abrir}>
            <label className="field">
              Troco que tem na gaveta agora
              <input type="number" step="0.01" placeholder="0,00" value={valorInicial} onChange={(e) => setValorInicial(e.target.value)} />
            </label>
            <button className="btn btn-primary btn-lg btn-block" disabled={carregando}>
              {carregando ? <Spinner /> : <><Unlock size={18} /> Abrir caixa</>}
            </button>
          </form>
        </motion.section>
      )}

      {fechado && !caixa && (
        <motion.section className="glass glass-pad" style={{ marginTop: 18 }} {...fadeUp}>
          <div className="card-title"><h3>Conferência do fechamento</h3></div>
          <div className="grid kpis" style={{ marginBottom: 16 }}>
            <div className="glass stat" style={{ '--sbar': '#15705a' }}>
              <div className="label">Total vendido</div>
              <div className="value">{brl(fechado.total_vendido)}</div>
            </div>
            <div className="glass stat" style={{ '--sbar': fechado.diferenca_dinheiro === 0 ? '#15705a' : '#b32218' }}>
              <div className="label">Diferença na gaveta</div>
              <div className="value">{brl(fechado.diferenca_dinheiro)}</div>
            </div>
            <div className="glass stat" style={{ '--sbar': fechado.diferenca_maquininhas === 0 ? '#15705a' : '#b32218' }}>
              <div className="label">Diferença maquininhas</div>
              <div className="value">{brl(fechado.diferenca_maquininhas)}</div>
            </div>
          </div>
          <p className="muted" style={{ fontSize: 13.5 }}>
            Dinheiro esperado {brl(fechado.dinheiro_esperado)}, contado {brl(fechado.dinheiro_contado)}. Cartão e Pix no sistema {brl(fechado.cartao_pix_sistema)}, nas maquininhas {brl(fechado.cartao_pix_maquininhas)}.
          </p>
        </motion.section>
      )}

      {caixa && (
        <>
          {relatorio && (
            <div className="grid kpis" style={{ marginBottom: 18 }}>
              <motion.div className="glass stat" style={{ '--sbar': '#15705a' }} {...fadeUp}>
                <div className="label">Total vendido hoje</div>
                <div className="value">{brl(relatorio.total_vendido)}</div>
                <div className="sub">{relatorio.comandas_fechadas} comandas fechadas</div>
              </motion.div>
              <motion.div className="glass stat" style={{ '--sbar': '#1f5d7a' }} {...fadeUp}>
                <div className="label">Esperado na gaveta</div>
                <div className="value">{brl(esperadoGaveta)}</div>
                <div className="sub">troco {brl(caixa.valor_inicial)} + dinheiro</div>
              </motion.div>
              <motion.div className="glass stat" style={{ '--sbar': '#a9711a' }} {...fadeUp}>
                <div className="label">Cartão e Pix</div>
                <div className="value">{brl(esperadoCartao)}</div>
                <div className="sub">confira com as maquininhas</div>
              </motion.div>
            </div>
          )}

          <div className="grid grid-2">
            {relatorio && (
              <motion.section className="glass glass-pad" {...fadeUp}>
                <div className="card-title">
                  <span className="ico"><Banknote /></span>
                  <h3>Como entrou</h3>
                </div>
                <div className="split">
                  {['DINHEIRO', 'DEBITO', 'CREDITO', 'PIX'].map((forma) => {
                    const valor = Number(relatorio.por_forma[forma] || 0)
                    const pct = relatorio.total_vendido ? (valor / relatorio.total_vendido) * 100 : 0
                    return (
                      <div className="split-row" key={forma}>
                        <div className="sl">
                          <span className="nm"><span className="sw" style={{ background: FORMA_COR[forma] }} />{FORMA_LABEL[forma]}</span>
                          <span className="mono muted">{brl(valor)}</span>
                        </div>
                        <div className="track"><div className="bar" style={{ width: `${Math.max(2, pct)}%`, background: FORMA_COR[forma] }} /></div>
                      </div>
                    )
                  })}
                </div>
              </motion.section>
            )}

            <motion.section className="glass glass-pad" {...fadeUp}>
              <div className="card-title">
                <span className="ico"><Lock /></span>
                <h3>Fechar o caixa</h3>
                <span className="chip ok" style={{ marginLeft: 'auto' }}><span className="chip-dot" /> aberto</span>
              </div>
              <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
                Caixa #{caixa.id} aberto às {new Date(caixa.aberto_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.
              </p>
              <form className="stack" onSubmit={fechar}>
                <label className="field">
                  <span className="row spread">
                    <span className="row" style={{ gap: 6 }}><Banknote size={14} /> Dinheiro contado na gaveta</span>
                    <DiffChip valor={difGaveta} />
                  </span>
                  <input type="number" step="0.01" placeholder="0,00" value={contado} onChange={(e) => setContado(e.target.value)} required />
                  <small className="muted" style={{ fontSize: 12 }}>Esperado: {brl(esperadoGaveta)}</small>
                </label>
                <label className="field">
                  <span className="row spread">
                    <span className="row" style={{ gap: 6 }}><CreditCard size={14} /> Total do relatório das maquininhas</span>
                    <DiffChip valor={difMaq} />
                  </span>
                  <input type="number" step="0.01" placeholder="0,00" value={maquininhas} onChange={(e) => setMaquininhas(e.target.value)} />
                  <small className="muted" style={{ fontSize: 12 }}>No sistema: {brl(esperadoCartao)}</small>
                </label>
                <button className="btn btn-primary btn-lg btn-block" disabled={carregando}>
                  {carregando ? <Spinner /> : <><Lock size={18} /> Fechar caixa</>}
                </button>
              </form>
            </motion.section>
          </div>
        </>
      )}
    </div>
  )
}
