import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut } from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Caixa from './pages/Caixa'
import Comandas from './pages/Comandas'
import Cozinha from './pages/Cozinha'
import Dashboard from './pages/Dashboard'
import Estoque from './pages/Estoque'
import Login from './pages/Login'
import { Spinner } from './lib/ui'

const MENU = [
  { path: '/dashboard', nome: 'Visão geral', perfis: ['ADMIN', 'CAIXA', 'GARCOM', 'COZINHA'] },
  { path: '/comandas', nome: 'Comandas', perfis: ['ADMIN', 'CAIXA', 'GARCOM'] },
  { path: '/cozinha', nome: 'Cozinha', perfis: ['ADMIN', 'CAIXA', 'GARCOM', 'COZINHA'] },
  { path: '/estoque', nome: 'Estoque', perfis: ['ADMIN', 'CAIXA'] },
  { path: '/caixa', nome: 'Caixa', perfis: ['ADMIN', 'CAIXA'] },
]

const PERFIL_COR = {
  ADMIN: '#ea1d2c',
  CAIXA: '#2f6fd0',
  GARCOM: '#138a5e',
  COZINHA: '#f97316',
}

function TopNav() {
  const { usuario, sair } = useAuth()
  const { pathname } = useLocation()
  const itens = MENU.filter((m) => m.perfis.includes(usuario.perfil))
  const inicial = usuario.nome?.trim()?.[0]?.toUpperCase() || 'U'

  return (
    <header className="topnav">
      <div className="topnav-inner">
        <div className="brand">
          <div className="name">
            Comanda<span>.</span>
          </div>
        </div>

        <nav className="nav">
          {itens.map((m) => {
            const ativo = pathname === m.path
            return (
              <NavLink key={m.path} to={m.path} className={`nav-item ${ativo ? 'active' : ''}`}>
                {ativo && (
                  <motion.span
                    layoutId="nav-active"
                    className="active-bg"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="lbl">{m.nome}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="nav-user">
          <div className="meta">
            <b>{usuario.nome}</b>
            <span>{usuario.perfil}</span>
          </div>
          <div className="avatar" style={{ background: PERFIL_COR[usuario.perfil] }}>
            {inicial}
          </div>
          <button className="logout" onClick={sair} title="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}

function Rotas() {
  const { usuario, carregando } = useAuth()

  if (carregando)
    return (
      <div className="center-screen">
        <Spinner className="dark" />
        <span>Carregando...</span>
      </div>
    )
  if (!usuario) return <Login />

  const inicial = usuario.perfil === 'COZINHA' ? '/cozinha' : '/dashboard'

  return (
    <div className="shell">
      <TopNav />
      <main className="content">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/comandas" element={<Comandas />} />
          <Route path="/cozinha" element={<Cozinha />} />
          <Route path="/estoque" element={<Estoque />} />
          <Route path="/caixa" element={<Caixa />} />
          <Route path="*" element={<Navigate to={inicial} replace />} />
        </Routes>
      </main>
    </div>
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
