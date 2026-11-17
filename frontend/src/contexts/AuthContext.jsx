import { createContext, useContext, useEffect, useState } from 'react'
import { api, clearToken, getToken, setToken } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!getToken()) {
      setCarregando(false)
      return
    }
    api
      .me()
      .then(setUsuario)
      .catch(() => clearToken())
      .finally(() => setCarregando(false))
  }, [])

  const entrar = async (email, senha) => {
    const dados = await api.login(email, senha)
    setToken(dados.access_token)
    setUsuario(dados.usuario)
  }

  const sair = () => {
    clearToken()
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
