import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { validateEmail, validatePassword, validateName, translateAuthError } from '../utils/auth'
import { api } from '../utils/api'

const AuthContext = createContext(null)

function normalizeRole(role) {
  if (role === 'admin') return 'admin'
  if (role === 'cashier') return 'cashier'
  return 'user'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verifyToken = () => {
      const token = localStorage.getItem('kafeehi_token')
      const savedUser = localStorage.getItem('kafeehi_user')
      if (!token || !savedUser) {
        localStorage.removeItem('kafeehi_token')
        localStorage.removeItem('kafeehi_user')
        setUser(null)
        setLoading(false)
        return
      }

      try {
        const parsed = JSON.parse(savedUser)
        const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parsed.name)
        if (isGuid && parsed.email) {
          parsed.name = parsed.email.split('@')[0]
        }
        setUser(parsed)
      } catch (err) {
        console.error('Failed to parse user session:', err)
        localStorage.removeItem('kafeehi_token')
        localStorage.removeItem('kafeehi_user')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    verifyToken()
  }, [])

  const register = useCallback(async ({ name, email, password }) => {
    const nameError = validateName(name)
    if (nameError) return { success: false, error: nameError }
    if (!validateEmail(email)) return { success: false, error: 'البريد الإلكتروني غير صالح' }

    const passwordError = validatePassword(password)
    if (passwordError) return { success: false, error: passwordError }

    const normalizedEmail = email.toLowerCase().trim()

    try {
      await api.post('/api/auth/register', {
        name: name.trim(),
        email: normalizedEmail,
        password,
      })

      return { success: true }
    } catch (err) {
      let friendlyError = translateAuthError(err.message)
      if (friendlyError === 'حدث خطأ ما في الخادم' || friendlyError === 'حدث خطأ غير متوقع') {
        friendlyError = 'البريد الإلكتروني مسجل بالفعل'
      }
      return { success: false, error: friendlyError }
    }
  }, [])

  const login = useCallback(async ({ email, password }) => {
    if (!validateEmail(email)) return { success: false, error: 'البريد الإلكتروني غير صالح' }
    if (!password) return { success: false, error: 'كلمة المرور مطلوبة' }

    setLoading(true)
    const normalizedEmail = email.toLowerCase().trim()

    try {
      const data = await api.post('/api/auth/login', {
        email: normalizedEmail,
        password,
      })

      const token = data.token
      const userData = data.user || data

      if (!token) {
        setLoading(false)
        return { success: false, error: 'لم يتم استلام رمز التحقق من السيرفر' }
      }

      localStorage.setItem('kafeehi_token', token)
      const sessionUser = {
        id: userData.id || userData._id,
        name: userData.name,
        email: userData.email || normalizedEmail,
        role: normalizeRole(userData.role),
      }
      const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionUser.name)
      if (isGuid && sessionUser.email) {
        sessionUser.name = sessionUser.email.split('@')[0]
      }
      localStorage.setItem('kafeehi_user', JSON.stringify(sessionUser))
      setUser(sessionUser)
      setLoading(false)
      return { success: true, role: sessionUser.role }
    } catch (err) {
      setLoading(false)
      return { success: false, error: translateAuthError(err.message) || 'البريد أو كلمة المرور غير صحيحة' }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('kafeehi_token')
    localStorage.removeItem('kafeehi_user')
    setUser(null)
  }, [])

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider
      value={{ user, loading, register, login, logout, isAuthenticated: !!user, isAdmin }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
