import { useEffect, useState } from 'react'
import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { LogOut, Menu, X } from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Logo from './components/Logo'
import Caixa from './pages/Caixa'
import Cardapio from './pages/Cardapio'
import Comandas from './pages/Comandas'
import Estoque from './pages/Estoque'
import Login from './pages/Login'
import Relatorios from './pages/Relatorios'
import Usuarios from './pages/Usuarios'
import { Spinner } from './lib/ui'

const MENU = [
  { path: '/comandas', nome: 'Comandas', perfis: ['GERENTE', 'CAIXA'] },
  { path: '/estoque', nome: 'Estoque', perfis: ['GERENTE', 'CAIXA'] },
  { path: '/caixa', nome: 'Caixa', perfis: ['GERENTE', 'CAIXA'] },
  { path: '/relatorios', nome: 'Relatórios', perfis: ['GERENTE', 'CAIXA'] },
  { path: '/cardapio', nome: 'Cardápio', perfis: ['GERENTE'] },
  { path: '/usuarios', nome: 'Usuários', perfis: ['GERENTE'] },
]

const PERFIL_COR = {
  GERENTE: '#6e1a15',
  CAIXA: '#15705a',
}

function TopNav() {
  const { usuario, sair } = useAuth()
  const { pathname } = useLocation()
  const [aberto, setAberto] = useState(false)
  const itens = MENU.filter((m) => m.perfis.includes(usuario.perfil))
  const inicial = usuario.nome?.trim()?.[0]?.toUpperCase() || 'U'
  const atual = itens.find((m) => m.path === pathname)

  useEffect(() => {
    setAberto(false)
  }, [pathname])

  return (
    <header className="topnav">
      <div className="topnav-inner">
        <Logo size={32} />

        <div className="nav-user">
          <div className="menu-wrap">
            <button className={`menu-btn ${aberto ? 'on' : ''}`} onClick={() => setAberto((v) => !v)}>
              {aberto ? <X size={18} /> : <Menu size={18} />}
              <span>{atual?.nome || 'Menu'}</span>
            </button>

            <AnimatePresence>
              {aberto && (
                <>
                  <motion.div
                    className="menu-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setAberto(false)}
                  />
                  <motion.nav
                    className="menu-dropdown"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    {itens.map((m) => (
                      <NavLink key={m.path} to={m.path} className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
                        {m.nome}
                      </NavLink>
                    ))}
                  </motion.nav>
                </>
              )}
            </AnimatePresence>
          </div>

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

  const inicial = '/comandas'

  return (
    <div className="shell">
      <TopNav />
      <main className="content">
        <Routes>
          <Route path="/comandas" element={<Comandas />} />
          <Route path="/estoque" element={<Estoque />} />
          <Route path="/caixa" element={<Caixa />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/cardapio" element={<Cardapio />} />
          <Route path="/usuarios" element={<Usuarios />} />
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
