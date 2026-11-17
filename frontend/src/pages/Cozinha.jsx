import { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api'

const PROXIMO = {
  RECEBIDO: 'PREPARANDO',
  PREPARANDO: 'PRONTO',
  PRONTO: 'ENTREGUE',
}

const ROTULO = {
  RECEBIDO: 'Iniciar preparo',
  PREPARANDO: 'Marcar pronto',
  PRONTO: 'Entregue',
}

const minutosDe = (iso) => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))

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

  const colunas = ['RECEBIDO', 'PREPARANDO', 'PRONTO']

  return (
    <div>
      <h2>Painel da cozinha</h2>
      <p className="muted">Atualiza sozinho a cada 5 segundos.</p>
      {erro && <p className="erro">{erro}</p>}

      <div className="grid-3">
        {colunas.map((coluna) => (
          <section key={coluna} className="card coluna">
            <h3>
              {coluna} <span className="badge">{pedidos.filter((p) => p.status_cozinha === coluna).length}</span>
            </h3>

            {pedidos
              .filter((p) => p.status_cozinha === coluna)
              .map((p) => (
                <article key={p.item_id} className={`pedido ${minutosDe(p.criado_em) > 15 ? 'atrasado' : ''}`}>
                  <header>
                    <strong>Mesa {p.mesa}</strong>
                    <span className="muted">{minutosDe(p.criado_em)} min</span>
                  </header>
                  <p className="pedido-nome">
                    {p.qtd}x {p.produto_nome}
                  </p>
                  {p.observacao && <p className="obs">{p.observacao}</p>}
                  <button className="primary" onClick={() => avancar(p)}>
                    {ROTULO[p.status_cozinha]}
                  </button>
                </article>
              ))}
          </section>
        ))}
      </div>
    </div>
  )
}
