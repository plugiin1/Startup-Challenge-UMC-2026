import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Wallet, Unlock, Lock, Scale } from 'lucide-react'
import { api } from '../services/api'
import { brl, fadeUp, Spinner } from '../lib/ui'

function LinhaResumo({ label, valor, destaque, forte }) {
  return (
    <div className="row spread" style={{ padding: '11px 2px', borderTop: '1px solid var(--stroke)' }}>
      <span className={forte ? '' : 'muted'} style={forte ? { fontWeight: 600 } : undefined}>{label}</span>
      <span
        className="mono"
        style={{
          fontWeight: destaque ? 700 : 500,
          color: destaque ? (Number(valor) === 0 ? 'var(--emerald)' : 'var(--amber)') : forte ? 'var(--ink)' : 'var(--ink-2)',
        }}
      >
        {brl(valor)}
      </span>
    </div>
  )
}

export default function Caixa() {
  const [caixa, setCaixa] = useState(null)
  const [relatorio, setRelatorio] = useState(null)
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
      setRelatorio(resultado)
      setCaixa(null)
      setContado('')
      setMaquininhas('')
      setErro('')
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div>
      <div className="page-head">
        <div className="eyebrow">Financeiro</div>
        <h1>Caixa</h1>
        <p>Feche o dia batendo a gaveta com as maquininhas, sem somar comanda na mão.</p>
      </div>

      <div className="grid grid-2">
        <motion.section className="glass glass-pad" {...fadeUp}>
          <div className="card-title">
            <span className="ico"><Wallet /></span>
            <h3>{caixa ? 'Caixa aberto' : 'Abrir caixa'}</h3>
            {caixa && <span className="chip ok" style={{ marginLeft: 'auto' }}><span className="chip-dot" /> aberto</span>}
          </div>

          {erro && <p className="form-msg-erro" style={{ marginBottom: 14 }}>{erro}</p>}

          {!caixa ? (
            <form className="stack" onSubmit={abrir}>
              <label className="field">
                Troco inicial na gaveta
                <input type="number" step="0.01" placeholder="0,00" value={valorInicial} onChange={(e) => setValorInicial(e.target.value)} />
              </label>
              <button className="btn btn-primary btn-block" disabled={carregando}>
                {carregando ? <Spinner /> : <><Unlock size={17} /> Abrir caixa</>}
              </button>
            </form>
          ) : (
            <>
              <p className="muted" style={{ fontSize: 14, marginBottom: 16 }}>
                Caixa #{caixa.id} aberto em {new Date(caixa.aberto_em).toLocaleString('pt-BR')} com {brl(caixa.valor_inicial)} de troco.
              </p>
              <form className="stack" onSubmit={fechar}>
                <label className="field">
                  <span className="row" style={{ gap: 6 }}><Scale size={14} /> Dinheiro contado na gaveta</span>
                  <input type="number" step="0.01" placeholder="0,00" value={contado} onChange={(e) => setContado(e.target.value)} required />
                </label>
                <label className="field">
                  Total do relatório das maquininhas
                  <input type="number" step="0.01" placeholder="0,00" value={maquininhas} onChange={(e) => setMaquininhas(e.target.value)} />
                </label>
                <button className="btn btn-primary btn-block" disabled={carregando}>
                  {carregando ? <Spinner /> : <><Lock size={17} /> Fechar e conciliar</>}
                </button>
              </form>
            </>
          )}
        </motion.section>

        <motion.section className="glass glass-pad" {...fadeUp}>
          <div className="card-title">
            <span className="ico"><Scale /></span>
            <h3>Conferência do dia</h3>
          </div>

          {!relatorio ? (
            <p className="muted" style={{ fontSize: 14 }}>Abra o caixa para ver o resumo do dia.</p>
          ) : (
            <div>
              <div style={{ background: 'var(--emerald-soft)', border: '1px solid #c9ead9', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                <span className="label" style={{ color: 'var(--emerald)', fontWeight: 600 }}>Total vendido</span>
                <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--ink)', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>
                  {brl(relatorio.total_vendido)}
                </div>
              </div>
              {Object.entries(relatorio.por_forma).map(([forma, valor]) => (
                <LinhaResumo key={forma} label={forma} valor={valor} />
              ))}
              <LinhaResumo label="Dinheiro esperado" valor={relatorio.dinheiro_esperado} forte />
              <LinhaResumo label="Dinheiro contado" valor={relatorio.dinheiro_contado} />
              <LinhaResumo label="Diferença na gaveta" valor={relatorio.diferenca_dinheiro} destaque />
              <LinhaResumo label="Cartão e Pix no sistema" valor={relatorio.cartao_pix_sistema} forte />
              <LinhaResumo label="Diferença das maquininhas" valor={relatorio.diferenca_maquininhas} destaque />
              <div className="row spread" style={{ paddingTop: 14, marginTop: 6 }}>
                <span className="badge">{relatorio.comandas_fechadas} fechadas</span>
                <span className="badge">{relatorio.comandas_abertas} ainda abertas</span>
              </div>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  )
}
