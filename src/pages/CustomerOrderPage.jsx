import { useState, useMemo, useEffect, useRef } from 'react'
import { Minus, Plus, Trash2, CheckCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import ReceiptModal from '../components/ReceiptModal'
import {
  formatCurrency,
  TABLE_NUMBERS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from '../data/mockData'

export default function CustomerOrderPage() {
  const { user } = useAuth()
  const { drinks, submitCustomerOrder, orders, addToast, playChime, isDrinkInStock, getMaxDrinkQty } = useApp()
  const [tableNumber, setTableNumber] = useState('')
  const [category, setCategory] = useState('all')
  const [cart, setCart] = useState([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastOrder, setLastOrder] = useState(null)
  const [selectedReceipt, setSelectedReceipt] = useState(null)

  const enabledDrinks = drinks.filter((d) => d.enabled)
  const filteredDrinks = enabledDrinks.filter(
    (d) => category === 'all' || d.category === category
  )
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  const myOrders = useMemo(
    () => orders.filter((o) => o.type === 'customer' && o.customerId === user.id).slice().reverse(),
    [orders, user.id]
  )
  const activeOrders = useMemo(
    () => myOrders.filter((o) => ['pending', 'accepted', 'ready'].includes(o.status)),
    [myOrders]
  )
  const activeOrderOnTable = useMemo(
    () => tableNumber ? activeOrders.find((o) => o.tableNumber === Number(tableNumber)) : null,
    [activeOrders, tableNumber]
  )

  const prevStatuses = useRef({})

  // Auto-select table number from URL query parameter (e.g. ?table=5)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const table = params.get('table')
    if (table && TABLE_NUMBERS.includes(Number(table))) {
      setTableNumber(table)
    }
  }, [])

  // Track status changes of active orders
  useEffect(() => {
    activeOrders.forEach((order) => {
      const prevStatus = prevStatuses.current[order.id]
      if (prevStatus && prevStatus !== order.status) {
        // Play synthesized alert sound
        playChime()
        
        // Show Toast
        if (order.status === 'accepted') {
          addToast(`تم قبول طلبك لطاولة ${order.tableNumber}! ☕`, 'success')
        } else if (order.status === 'ready') {
          addToast(`طلبك لطاولة ${order.tableNumber} جاهز للاستلام! 🎉`, 'success')
        }
      }
      prevStatuses.current[order.id] = order.status
    })
  }, [activeOrders, addToast, playChime])

  const addToCart = (drink) => {
    if (!tableNumber) {
      addToast('الرجاء اختيار رقم الطاولة أولاً من الأعلى 👆 لكي تتمكن من إضافة المشروب.', 'warning')
      return
    }
    const existing = cart.find((i) => i.id === drink.id)
    const currentQty = existing ? existing.qty : 0
    if (!isDrinkInStock(drink, currentQty + 1)) {
      addToast(`عذراً، لا يوجد مخزون كافي لتحضير مشروب "${drink.name}"`, 'warning')
      return
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.id === drink.id)
      if (existing) {
        return prev.map((i) => (i.id === drink.id ? { ...i, qty: i.qty + 1 } : i))
      }
      return [...prev, { ...drink, qty: 1 }]
    })
  }

  const updateQty = (id, delta) => {
    if (delta > 0) {
      const item = cart.find((i) => i.id === id)
      if (item && !isDrinkInStock(item, item.qty + delta)) {
        addToast(`عذراً، لا يوجد مخزون كافي لإضافة المزيد من مشروب "${item.name}"`, 'warning')
        return
      }
    }
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    )
  }

  const handleSubmit = async () => {
    const result = await submitCustomerOrder(cart, tableNumber, user.id, user.name)
    if (result.success) {
      setLastOrder(result.order)
      setShowSuccess(true)
      setCart([])
    } else {
      alert(`فشل إرسال الطلب: ${result.message || 'حدث خطأ ما'}`)
    }
  }

  const categories = [
    { key: 'all', label: 'الكل' },
    { key: 'hot', label: 'ساخن ☕' },
    { key: 'cold', label: 'بارد 🍹' },
  ]

  return (
    <div className="mx-auto max-w-4xl p-4 pb-8 transition-colors duration-300 animate-page-fade">
      <div className="mb-6 rounded-xl border border-cream-dark bg-white p-4 shadow-sm transition-colors duration-300">
        <label className="mb-2 block text-sm font-medium text-gray-700">رقم الطاولة</label>
        <div className="flex flex-wrap gap-2">
          {TABLE_NUMBERS.map((num) => (
            <button
              key={num}
              onClick={() => setTableNumber(String(num))}
              className={`h-10 w-10 rounded-lg text-sm font-medium transition-all duration-300 active-press hover:scale-105 ${
                tableNumber === String(num)
                  ? 'bg-accent text-white shadow-md font-bold'
                  : 'border border-cream-dark bg-cream text-gray-850 hover:bg-tan'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
        {!tableNumber && (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">اختار رقم الطاولة الأول قبل الطلب</p>
        )}
      </div>

      {activeOrders.length > 0 && (
        <div className="mb-6 space-y-3">
          {activeOrders.map((order) => (
            <div key={order.id} className={`rounded-xl border p-4 transition-all duration-300 animate-page-fade ${
              order.status === 'ready'
                ? 'border-green-500 bg-green-500/5 dark:bg-green-500/10 animate-pulse-glow'
                : 'border-accent/30 bg-accent/5 dark:bg-accent/10 dark:border-accent/40'
            }`}>
              <p className="mb-1 text-sm font-medium text-gray-800 dark:text-white">طلبك الحالي — طاولة {order.tableNumber}</p>
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                {ORDER_STATUS_LABELS[order.status]}
              </span>
              <ul className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                {order.items.map((item) => (
                  <li key={item.id}>{item.name} × {item.qty}</li>
                ))}
              </ul>
              <p className="mt-2 font-bold">{formatCurrency(order.total)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mb-4 flex gap-2">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 active-press hover:scale-105 ${
              category === cat.key
                ? 'bg-accent text-white shadow-md font-bold'
                : 'border border-cream-dark bg-cream text-gray-700 hover:bg-tan'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {filteredDrinks.map((drink, index) => {
          const maxQty = getMaxDrinkQty(drink)
          const outOfStock = maxQty === 0
          return (
            <button
              key={drink.id}
              onClick={() => addToCart(drink)}
              disabled={outOfStock}
              className={`flex min-h-[90px] flex-col rounded-xl border-t-4 bg-white p-3 text-right shadow-sm card-hover-lift active-press animate-item-slide delay-${Math.min(index + 1, 12)} ${outOfStock ? 'opacity-60 cursor-not-allowed' : ''}`}
              style={{ borderTopColor: drink.category === 'hot' ? 'var(--color-hot)' : 'var(--color-cold)' }}
            >
              <div className="flex justify-between items-start w-full gap-2">
                <span className="text-sm font-semibold leading-tight">{drink.name}</span>
                {outOfStock && (
                  <span className="shrink-0 rounded bg-red-150 text-red-700 dark:bg-red-950/40 dark:text-red-300 px-1.5 py-0.5 text-[9px] font-bold">
                    نفذ
                  </span>
                )}
              </div>
              <span className="mt-auto text-sm font-bold text-gray-600 dark:text-gray-400">{formatCurrency(drink.price)}</span>
            </button>
          )
        })}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-cream-dark bg-white p-4 shadow-lg transition-colors duration-300">
          <div className="mx-auto max-w-4xl">
            <div className="mb-3 max-h-32 space-y-2 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg bg-cream px-3 py-2">
                  <span className="text-sm font-medium">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="rounded bg-white border p-1 text-gray-700 active:scale-90 transition-transform"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-5 text-center text-sm font-bold">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="rounded bg-white border p-1 text-gray-700 active:scale-90 transition-transform"
                    >
                      <Plus size={14} />
                    </button>
                    <button onClick={() => updateQty(item.id, -item.qty)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-lg font-bold">{formatCurrency(total)}</span>
              <button
                onClick={handleSubmit}
                disabled={!tableNumber}
                className="flex-1 rounded-xl bg-accent py-3 font-bold text-white hover:bg-accent-hover disabled:opacity-50 transition-all duration-300 hover:shadow-md active-press shadow-sm"
              >
                إرسال الطلب
              </button>
            </div>
          </div>
        </div>
      )}

      {myOrders.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-bold">طلباتي السابقة</h2>
          <div className="space-y-2">
            {myOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-lg border border-cream-dark bg-white px-4 py-3 transition-colors duration-300">
                <div>
                  <p className="text-sm font-medium">طاولة {order.tableNumber}</p>
                  <p className="text-xs text-gray-500 dark:text-white/60">
                    {new Date(order.timestamp).toLocaleString('ar-EG')}
                  </p>
                  {order.status === 'completed' && (
                    <button
                      onClick={() => setSelectedReceipt(order)}
                      className="mt-1 flex items-center gap-1 text-[11px] font-bold text-accent dark:text-accent-hover hover:underline"
                    >
                      عرض الفاتورة الرقمية 🧾
                    </button>
                  )}
                </div>
                <div className="text-left">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <p className="mt-1 text-sm font-bold">{formatCurrency(order.total)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={showSuccess} onClose={() => setShowSuccess(false)} title="تم إرسال الطلب" size="sm">
        {lastOrder && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-center text-green-600">
              <CheckCircle size={48} />
            </div>
            <p>طلبك وصل للكاشير — طاولة <strong>{lastOrder.tableNumber}</strong></p>
            <p>الإجمالي: <strong>{formatCurrency(lastOrder.total)}</strong></p>
            <p className="text-gray-500">هتدفع كاش لما الطلب يجهز</p>
            <button
              onClick={() => setShowSuccess(false)}
              className="w-full rounded-lg bg-accent py-2.5 font-medium text-white"
            >
              تمام
            </button>
          </div>
        )}
      </Modal>

      {/* Digital Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        order={selectedReceipt}
      />

      {(cart.length > 0) && <div className="h-48" />}
    </div>
  )
}
