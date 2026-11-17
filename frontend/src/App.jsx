import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Caixa from './pages/Caixa'
import Comandas from './pages/Comandas'
import Cozinha from './pages/Cozinha'
import Estoque from './pages/Estoque'
import Login from './pages/Login'

const MENU = [
  { path: '/comandas', nome: 'Comandas', perfis: ['ADMIN', 'CAIXA', 'GARCOM'] },
  { path: '/cozinha', nome: 'Cozinha', perfis: ['ADMIN', 'CAIXA', 'GARCOM', 'COZINHA'] },
  { path: '/estoque', nome: 'Estoque', perfis: ['ADMIN', 'CAIXA'] },
  { path: '/caixa', nome: 'Caixa', perfis: ['ADMIN', 'CAIXA'] },
]

function Layout({ children }) {
  const { usuario, sair } = useAuth()
  const { pathname } = useLocation()
  const itens = MENU.filter((m) => m.perfis.includes(usuario.perfil))

  return (
    <div className="app">
      <header className="topo">
        <strong>Gestão do Restaurante</strong>
        <nav>
          {itens.map((m) => (
            <Link key={m.path} to={m.path} className={pathname === m.path ? 'ativo' : ''}>
              {m.nome}
            </Link>
          ))}
        </nav>
        <div className="usuario">
          <span>
            {usuario.nome} <span className="badge">{usuario.perfil}</span>
          </span>
          <button onClick={sair}>Sair</button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}

function Rotas() {
  const { usuario, carregando } = useAuth()

  if (carregando) return <p className="centro">Carregando...</p>
  if (!usuario) return <Login />

  const inicial = usuario.perfil === 'COZINHA' ? '/cozinha' : '/comandas'

  return (
    <Layout>
      <Routes>
        <Route path="/comandas" element={<Comandas />} />
        <Route path="/cozinha" element={<Cozinha />} />
        <Route path="/estoque" element={<Estoque />} />
        <Route path="/caixa" element={<Caixa />} />
        <Route path="*" element={<Navigate to={inicial} replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Rotas />
      </AuthProvider>
    </BrowserRouter>
  )
}
