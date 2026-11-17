import { useEffect, useState } from 'react'
import { api } from '../services/api'

export default function Estoque() {
  const [insumos, setInsumos] = useState([])
  const [erro, setErro] = useState('')
  const [insumoId, setInsumoId] = useState('')
  const [tipo, setTipo] = useState('ENTRADA')
  const [qtd, setQtd] = useState('')

  const carregar = async () => {
    try {
      setInsumos(await api.insumos())
      setErro('')
    } catch (e) {
      setErro(e.message)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const movimentar = async (e) => {
    e.preventDefault()
    try {
      await api.movimentarEstoque({
        insumo_id: Number(insumoId),
        tipo,
        qtd: Number(qtd),
      })
      setQtd('')
      await carregar()
    } catch (err) {
      setErro(err.message)
    }
  }

  const emAlerta = insumos.filter((i) => i.abaixo_do_minimo)

  return (
    <div>
      <h2>Estoque</h2>
      {erro && <p className="erro">{erro}</p>}

      {emAlerta.length > 0 && (
        <div className="card alerta">
          <strong>Repor hoje:</strong> {emAlerta.map((i) => i.nome).join(', ')}
        </div>
      )}

      <section className="card">
        <form className="form-item" onSubmit={movimentar}>
          <select value={insumoId} onChange={(e) => setInsumoId(e.target.value)} required>
            <option value="">Insumo...</option>
            {insumos.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome}
              </option>
            ))}
          </select>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="ENTRADA">Entrada</option>
            <option value="SAIDA">Saída</option>
            <option value="AJUSTE">Ajuste</option>
          </select>
          <input
            type="number"
            step="0.001"
            placeholder="Quantidade"
            value={qtd}
            onChange={(e) => setQtd(e.target.value)}
            required
          />
          <button className="primary">Registrar</button>
        </form>

        <table className="tabela">
          <thead>
            <tr>
              <th>Insumo</th>
              <th>Atual</th>
              <th>Mínimo</th>
            </tr>
          </thead>
          <tbody>
            {insumos.map((i) => (
              <tr key={i.id} className={i.abaixo_do_minimo ? 'destaque' : ''}>
                <td>{i.nome}</td>
                <td className="valor">
                  {i.qtd_atual} {i.unidade}
                </td>
                <td className="valor muted">
                  {i.qtd_minima} {i.unidade}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
