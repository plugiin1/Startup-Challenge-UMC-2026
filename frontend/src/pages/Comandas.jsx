import { useEffect, useState } from 'react'
import { api } from '../services/api'

const brl = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Comandas() {
  const [comandas, setComandas] = useState([])
  const [produtos, setProdutos] = useState([])
  const [selecionada, setSelecionada] = useState(null)
  const [mesa, setMesa] = useState('')
  const [erro, setErro] = useState('')

  const [produtoId, setProdutoId] = useState('')
  const [qtd, setQtd] = useState(1)
  const [peso, setPeso] = useState('')
  const [obs, setObs] = useState('')

  const produto = produtos.find((p) => String(p.id) === String(produtoId))

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

  const abrir = async (e) => {
    e.preventDefault()
    setErro('')
    try {
      const nova = await api.abrirComanda(mesa, null)
      setMesa('')
      await carregar()
      setSelecionada(nova)
    } catch (err) {
      setErro(err.message)
    }
  }

  const ver = async (id) => {
    setErro('')
    try {
      setSelecionada(await api.comanda(id))
    } catch (e) {
      setErro(e.message)
    }
  }

  const lancar = async (e) => {
    e.preventDefault()
    setErro('')
    try {
      await api.lancarItem(selecionada.id, {
        produto_id: Number(produtoId),
        qtd: Number(qtd),
        peso_kg: peso ? Number(peso) : null,
        observacao: obs || null,
      })
      setPeso('')
      setObs('')
      setQtd(1)
      await ver(selecionada.id)
      await carregar()
    } catch (err) {
      setErro(err.message)
    }
  }

  const fechar = async () => {
    setErro('')
    const forma = window.prompt('Forma de pagamento (DINHEIRO, DEBITO, CREDITO, PIX)', 'PIX')
    if (!forma) return
    try {
      await api.fecharComanda(selecionada.id, [
        { forma: forma.toUpperCase(), valor: selecionada.total },
      ])
      setSelecionada(null)
      await carregar()
    } catch (err) {
      setErro(err.message)
    }
  }

  return (
    <div className="grid-2">
      <section className="card">
        <h2>Comandas abertas</h2>
        <form className="linha" onSubmit={abrir}>
          <input
            placeholder="Mesa (ex: 12)"
            value={mesa}
            onChange={(e) => setMesa(e.target.value)}
            required
          />
          <button className="primary">Abrir</button>
        </form>

        {erro && <p className="erro">{erro}</p>}

        <ul className="lista">
          {comandas.map((c) => (
            <li key={c.id}>
              <button className="item-botao" onClick={() => ver(c.id)}>
                <strong>Mesa {c.mesa}</strong>
                <span>#{c.id}</span>
                <span className="valor">{brl(c.total)}</span>
              </button>
            </li>
          ))}
          {comandas.length === 0 && <p className="muted">Nenhuma comanda aberta.</p>}
        </ul>
      </section>

      <section className="card">
        {!selecionada && <p className="muted">Selecione uma comanda para lançar itens.</p>}

        {selecionada && (
          <>
            <h2>
              Mesa {selecionada.mesa} <span className="muted">#{selecionada.id}</span>
            </h2>

            <form className="form-item" onSubmit={lancar}>
              <select value={produtoId} onChange={(e) => setProdutoId(e.target.value)} required>
                <option value="">Produto...</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} — {brl(p.preco)}
                    {p.tipo === 'KG' ? '/kg' : ''}
                  </option>
                ))}
              </select>

              {produto?.tipo === 'KG' ? (
                <input
                  type="number"
                  step="0.001"
                  placeholder="Peso (kg)"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  required
                />
              ) : (
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={qtd}
                  onChange={(e) => setQtd(e.target.value)}
                />
              )}

              <input
                placeholder="Observação (ex: sem cebola)"
                value={obs}
                onChange={(e) => setObs(e.target.value)}
              />
              <button className="primary">Lançar</button>
            </form>

            <table className="tabela">
              <tbody>
                {selecionada.itens.map((i) => (
                  <tr key={i.id}>
                    <td>{i.produto_nome}</td>
                    <td>{i.peso_kg ? `${i.peso_kg} kg` : `${i.qtd}x`}</td>
                    <td>
                      <span className={`tag ${i.status_cozinha}`}>{i.status_cozinha}</span>
                    </td>
                    <td className="valor">{brl(i.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="total-linha">
              <span>Total</span>
              <strong>{brl(selecionada.total)}</strong>
            </div>
            <button className="primary largo" onClick={fechar}>
              Fechar comanda
            </button>
          </>
        )}
      </section>
    </div>
  )
}
