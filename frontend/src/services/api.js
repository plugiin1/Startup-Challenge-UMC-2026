const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const TOKEN_KEY = 'restaurante.token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

async function request(path, { method = 'GET', body, form } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: form ? form : body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    clearToken()
    throw new Error('Sessão expirada. Faça login novamente.')
  }
  if (!res.ok) {
    const erro = await res.json().catch(() => ({}))
    throw new Error(erro.detail || `Erro ${res.status}`)
  }
  return res.status === 204 ? null : res.json()
}

export const api = {
  login: (email, senha) => {
    const form = new URLSearchParams({ username: email, password: senha })
    return request('/auth/login', { method: 'POST', form })
  },
  me: () => request('/auth/me'),

  usuarios: () => request('/auth/usuarios'),
  criarUsuario: (dados) => request('/auth/usuarios', { method: 'POST', body: dados }),
  alternarUsuario: (id) => request(`/auth/usuarios/${id}`, { method: 'PATCH' }),

  config: () => request('/config'),
  salvarConfig: (dados) => request('/config', { method: 'PUT', body: dados }),

  produtos: () => request('/produtos'),
  produtosTodos: () => request('/produtos?apenas_ativos=false'),
  categorias: () => request('/produtos/categorias'),
  criarCategoria: (nome) => request('/produtos/categorias', { method: 'POST', body: { nome } }),
  criarProduto: (dados) => request('/produtos', { method: 'POST', body: dados }),
  atualizarProduto: (id, dados) => request(`/produtos/${id}`, { method: 'PUT', body: dados }),
  removerProduto: (id) => request(`/produtos/${id}`, { method: 'DELETE' }),

  ficha: (produtoId) => request(`/estoque/ficha/${produtoId}`),
  salvarFicha: (produtoId, dados) => request(`/estoque/ficha/${produtoId}`, { method: 'POST', body: dados }),
  criarInsumo: (dados) => request('/estoque/insumos', { method: 'POST', body: dados }),

  relatorioVendas: (inicio, fim) => request(`/relatorios/vendas?inicio=${inicio}&fim=${fim}`),
  relatorioProdutos: (inicio, fim, limite = 10) =>
    request(`/relatorios/produtos?inicio=${inicio}&fim=${fim}&limite=${limite}`),

  comandas: (status = 'ABERTA') => request(`/comandas?status_filtro=${status}`),
  comanda: (id) => request(`/comandas/${id}`),
  abrirComanda: (mesa, cliente) =>
    request('/comandas', { method: 'POST', body: { mesa, cliente } }),
  lancarItem: (id, item) =>
    request(`/comandas/${id}/itens`, { method: 'POST', body: item }),
  removerItem: (id, itemId) =>
    request(`/comandas/${id}/itens/${itemId}`, { method: 'DELETE' }),
  cancelarComanda: (id) => request(`/comandas/${id}/cancelar`, { method: 'POST' }),
  fecharComanda: (id, pagamentos, aplicar_taxa = true) =>
    request(`/comandas/${id}/fechar`, { method: 'POST', body: { pagamentos, aplicar_taxa } }),

  pedidosCozinha: () => request('/cozinha/pedidos'),
  mudarStatusItem: (itemId, status) =>
    request(`/cozinha/itens/${itemId}`, {
      method: 'PATCH',
      body: { status_cozinha: status },
    }),

  insumos: () => request('/estoque/insumos'),
  alertasEstoque: () => request('/estoque/alertas'),
  movimentarEstoque: (dados) =>
    request('/estoque/movimentos', { method: 'POST', body: dados }),

  caixaAtual: () => request('/caixa/atual'),
  abrirCaixa: (valor_inicial) =>
    request('/caixa/abrir', { method: 'POST', body: { valor_inicial } }),
  relatorioCaixa: () => request('/caixa/relatorio'),
  fecharCaixa: (dados) => request('/caixa/fechar', { method: 'POST', body: dados }),
}
