import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import AuthLayout, { AuthLink } from '../components/AuthLayout'

export default function RegisterPage() {
  const { register } = useAuth()
  const { addToast } = useApp()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('كلمة المرور غير متطابقة')
      return
    }

    setLoading(true)
    const result = await register({ name, email, password })
    setLoading(false)

    if (result.success) {
      addToast('تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني لتفعيله قبل تسجيل الدخول.', 'success')
      navigate('/login')
    } else {
      setError(result.error)
    }
  }

  return (
    <AuthLayout title="إنشاء حساب" subtitle="أنشئ حسابك الآن كزبون لطلب المشروبات مباشرة من طاولتك">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">الاسم بالكامل</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: أحمد محمد"
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
          <p className="mt-1 text-xs text-gray-500">
            يجب إدخال الاسم ثنائياً على الأقل ويحتوي على أحرف فقط
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">كلمة المرور</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="مثال: P@ssw0rd"
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
          <p className="mt-1 text-xs text-gray-500">
            يجب أن تحتوي على حرف كبير (A-Z)، وحرف صغير (a-z)، ورقم (0-9)، ورمز خاص (مثل: P@ssw0rd)
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">تأكيد كلمة المرور</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="أعد كتابة كلمة المرور"
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          <UserPlus size={18} />
          {loading ? 'جاري التسجيل...' : 'إنشاء حساب'}
        </button>
      </form>

      <AuthLink to="/login" prefix="عندك حساب بالفعل؟" linkText="تسجيل الدخول" />
    </AuthLayout>
  )
}
