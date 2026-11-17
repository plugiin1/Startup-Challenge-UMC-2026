import { useEffect, useState } from 'react'
import { api } from '../services/api'

const brl = (v) =>
  v === null || v === undefined
    ? '—'
    : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Caixa() {
  const [caixa, setCaixa] = useState(null)
  const [relatorio, setRelatorio] = useState(null)
  const [valorInicial, setValorInicial] = useState('0')
  const [contado, setContado] = useState('')
  const [maquininhas, setMaquininhas] = useState('')
  const [erro, setErro] = useState('')

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
    try {
      await api.abrirCaixa(Number(valorInicial))
      await carregar()
    } catch (err) {
      setErro(err.message)
    }
  }

  const fechar = async (e) => {
    e.preventDefault()
    try {
      const resultado = await api.fecharCaixa({
        valor_contado: Number(contado),
        valor_maquininhas: Number(maquininhas || 0),
      })
      setRelatorio(resultado)
      setCaixa(null)
      setContado('')
      setMaquininhas('')
    } catch (err) {
      setErro(err.message)
    }
  }

  return (
    <div className="grid-2">
      <section className="card">
        <h2>Caixa</h2>
        {erro && <p className="erro">{erro}</p>}

        {!caixa && (
          <form className="linha" onSubmit={abrir}>
            <input
              type="number"
              step="0.01"
              placeholder="Troco inicial"
              value={valorInicial}
              onChange={(e) => setValorInicial(e.target.value)}
            />
            <button className="primary">Abrir caixa</button>
          </form>
        )}

        {caixa && (
          <>
            <p className="muted">
              Caixa #{caixa.id} aberto em {new Date(caixa.aberto_em).toLocaleString('pt-BR')} com{' '}
              {brl(caixa.valor_inicial)}
            </p>
            <form className="form-item" onSubmit={fechar}>
              <input
                type="number"
                step="0.01"
                placeholder="Dinheiro contado na gaveta"
                value={contado}
                onChange={(e) => setContado(e.target.value)}
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Total do relatório das maquininhas"
                value={maquininhas}
                onChange={(e) => setMaquininhas(e.target.value)}
              />
              <button className="primary">Fechar caixa</button>
            </form>
          </>
        )}
      </section>

      <section className="card">
        <h2>Conferência</h2>
        {!relatorio && <p className="muted">Abra o caixa para ver o resumo do dia.</p>}

        {relatorio && (
          <table className="tabela">
            <tbody>
              <tr>
                <td>Total vendido</td>
                <td className="valor">{brl(relatorio.total_vendido)}</td>
              </tr>
              {Object.entries(relatorio.por_forma).map(([forma, valor]) => (
                <tr key={forma}>
                  <td className="muted">{forma}</td>
                  <td className="valor muted">{brl(valor)}</td>
                </tr>
              ))}
              <tr>
                <td>Dinheiro esperado</td>
                <td className="valor">{brl(relatorio.dinheiro_esperado)}</td>
              </tr>
              <tr>
                <td>Dinheiro contado</td>
                <td className="valor">{brl(relatorio.dinheiro_contado)}</td>
              </tr>
              <tr className={relatorio.diferenca_dinheiro ? 'destaque' : ''}>
                <td>Diferença na gaveta</td>
                <td className="valor">{brl(relatorio.diferenca_dinheiro)}</td>
              </tr>
              <tr>
                <td>Cartão e Pix no sistema</td>
                <td className="valor">{brl(relatorio.cartao_pix_sistema)}</td>
              </tr>
              <tr className={relatorio.diferenca_maquininhas ? 'destaque' : ''}>
                <td>Diferença das maquininhas</td>
                <td className="valor">{brl(relatorio.diferenca_maquininhas)}</td>
              </tr>
              <tr>
                <td>Comandas fechadas</td>
                <td className="valor">{relatorio.comandas_fechadas}</td>
              </tr>
              <tr>
                <td>Comandas ainda abertas</td>
                <td className="valor">{relatorio.comandas_abertas}</td>
              </tr>
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
