import { useState, useMemo } from 'react'
import { Minus, Plus, Trash2, AlertTriangle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import PendingOrdersPanel from '../components/PendingOrdersPanel'
import ReceiptModal from '../components/ReceiptModal'
import Modal from '../components/Modal'
import { formatCurrency } from '../data/mockData'

export default function CashierPage() {
  const { drinks, completeOrder, checkCartStock, invoiceCounter, orders, undoLastOrder, addDrink, deleteDrink, isDrinkInStock, getMaxDrinkQty } = useApp()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [category, setCategory] = useState('all')
  const [cart, setCart] = useState([])
  const [amountPaid, setAmountPaid] = useState('')
  const [lastOrder, setLastOrder] = useState(null)
  const [cartBouncing, setCartBouncing] = useState(false)

  const enabledDrinks = drinks.filter((d) => d.enabled)
  const filteredDrinks = enabledDrinks.filter(
    (d) => category === 'all' || d.category === category
  )

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  const paid = Number(amountPaid) || 0
  const change = paid >= total ? paid - total : 0
  const shortages = useMemo(() => checkCartStock(cart), [cart, checkCartStock])

  const addToCart = (drink) => {
    const existing = cart.find((i) => i.id === drink.id)
    const currentQty = existing ? existing.qty : 0
    if (!isDrinkInStock(drink, currentQty + 1)) {
      alert(`عذراً، لا يوجد مخزون كافي في المخزن لتحضير مشروب "${drink.name}"`)
      return
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.id === drink.id)
      if (existing) {
        return prev.map((i) => (i.id === drink.id ? { ...i, qty: i.qty + 1 } : i))
      }
      return [...prev, { ...drink, qty: 1 }]
    })

    setCartBouncing(true)
    setTimeout(() => setCartBouncing(false), 300)
  }

  const updateQty = (id, delta) => {
    if (delta > 0) {
      const item = cart.find((i) => i.id === id)
      if (item && !isDrinkInStock(item, item.qty + delta)) {
        alert(`عذراً، لا يوجد مخزون كافي لإضافة المزيد من مشروب "${item.name}"`)
        return
      }
    }
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    )
  }

  const handleComplete = async () => {
    const result = await completeOrder(cart, 'cash', total, paid)
    if (!result.success) {
      if (result.error === 'stock') {
        alert(`مخزون غير كافي:\n${result.shortages.map((s) => `- ${s.name}: متاح ${s.available} ${s.unit || ''}، مطلوب ${s.needed}`).join('\n')}`)
      } else if (result.error === 'insufficient_payment') {
        alert('المبلغ المدفوع أقل من الإجمالي')
      } else {
        alert(`فشل إتمام الطلب: ${result.message || 'حدث خطأ ما'}`)
      }
      return
    }
    setLastOrder(result.order)
    setCart([])
    setAmountPaid('')
  }

  const quickAmounts = [50, 100, 200, 500]

  const categories = [
    { key: 'all', label: 'الكل' },
    { key: 'hot', label: 'ساخن ☕' },
    { key: 'cold', label: 'بارد 🍹' },
  ]

  const hasCounterOrders = orders.some((o) => o.type === 'counter' || !o.type)

  const canComplete = cart.length > 0 && paid >= total && shortages.length === 0

  return (
    <div className="flex h-full flex-col bg-cream text-gray-800 transition-colors duration-300 animate-page-fade">
      {!isAdmin && <PendingOrdersPanel />}

      <div className="flex flex-1 overflow-hidden" dir="ltr">
        {/* Cart Panel - Only visible for Cashier/Staff, hidden for Admin */}
        {!isAdmin && (
          <div className="flex w-80 shrink-0 flex-col border-r border-cream-dark bg-white text-gray-800 transition-colors duration-300" dir="rtl">
            <div className="relative border-b border-cream-dark px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-sidebar dark:text-accent">كافيهي ☕</h2>
                <p className="text-xs text-gray-400 dark:text-white/60">
                  فاتورة #{String(invoiceCounter).padStart(4, '0')}
                </p>
              </div>
              <div className={`relative p-2.5 bg-cream dark:bg-white/5 rounded-xl transition-all duration-300 ${cartBouncing ? 'scale-110 text-accent animate-cart-bounce' : 'text-gray-450 dark:text-gray-400'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shopping-cart"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white shadow-sm animate-pulse-glow">
                    {cart.reduce((sum, item) => sum + item.qty, 0)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {cart.length === 0 ? (
                <p className="py-12 text-center text-sm text-gray-400 dark:text-white/40">
                  السلة فاضية. دوس على أي مشروب لإضافته
                </p>
              ) : (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg bg-cream px-3 py-2 transition-colors">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(item.price)} × {item.qty}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.id, -1)} className="rounded bg-white border p-1.5 shadow-sm active:scale-90 transition-transform">
                          <Minus size={14} className="text-gray-700" />
                        </button>
                        <span className="w-5 text-center text-sm font-bold">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="rounded bg-white border p-1.5 shadow-sm active:scale-90 transition-transform">
                          <Plus size={14} className="text-gray-700" />
                        </button>
                        <button onClick={() => updateQty(item.id, -item.qty)} className="rounded p-1.5 text-red-400 hover:text-red-650 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {shortages.length > 0 && (
                <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-950/20 p-3 text-xs text-red-700 dark:text-red-300">
                  <div className="mb-1 flex items-center gap-1 font-bold">
                    <AlertTriangle size={14} />
                    مخزون غير كافي
                  </div>
                  {shortages.map((s) => (
                    <p key={s.name}>{s.name}: متاح {s.available}، مطلوب {s.needed}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Checkout Controls */}
            <div className="border-t border-cream-dark dark:border-white/10 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-white/60 font-semibold">الإجمالي</span>
                <span className="text-xl font-extrabold text-sidebar dark:text-accent">{formatCurrency(total)}</span>
              </div>

              <div className="mb-3">
                <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">المبلغ المدفوع</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg px-3 py-2.5 text-lg font-bold outline-none transition-colors"
                />
                <div className="mt-2 flex gap-1.5">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setAmountPaid(String(amt))}
                      className="flex-1 rounded-lg border border-cream-dark bg-cream-dark py-1 text-xs font-semibold hover:bg-tan transition-all duration-200 active-press hover:scale-105"
                    >
                      {amt}
                    </button>
                  ))}
                  <button
                    onClick={() => setAmountPaid(String(total))}
                    className="flex-1 rounded-lg border border-accent bg-accent/10 dark:bg-accent/20 py-1 text-xs font-bold text-accent hover:bg-accent/25 transition-all duration-200 active-press hover:scale-105"
                  >
                    بالظبط
                  </button>
                </div>
              </div>

              {paid >= total && total > 0 && (
                <div className="mb-3 flex items-center justify-between rounded-lg bg-green-50 dark:bg-green-950/20 px-3 py-2">
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">الباقي</span>
                  <span className="text-lg font-bold text-green-700 dark:text-green-300">{formatCurrency(change)}</span>
                </div>
              )}

              <button
                onClick={handleComplete}
                disabled={!canComplete}
                className="w-full rounded-xl py-3.5 text-base font-bold transition-all duration-300 disabled:cursor-not-allowed disabled:bg-tan dark:disabled:bg-tan/20 disabled:text-gray-405 dark:disabled:text-gray-500 bg-accent text-white hover:bg-accent-hover active-press shadow-md"
              >
                إتمـام الطلب
              </button>
            </div>
          </div>
        )}

        {/* Menu Items Grid */}
        <div className="flex flex-1 flex-col overflow-hidden bg-cream transition-colors duration-300" dir="rtl">
          <div className="flex gap-2 px-6 py-4 items-center">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 active-press hover:scale-105 ${
                  category === cat.key
                    ? 'bg-accent text-white shadow-md font-bold'
                    : 'border border-cream-dark bg-cream text-gray-700 hover:bg-tan'
                }`}
              >
                {cat.label}
              </button>
            ))}

            {hasCounterOrders && !isAdmin && (
              <button
                onClick={() => {
                  if (window.confirm('إلغاء آخر طلب؟')) undoLastOrder()
                }}
                className="mr-auto flex items-center gap-1.5 rounded-full border border-red-250 dark:border-red-900/50 px-4 py-2 text-xs font-bold text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all active-press hover:scale-105"
              >
                إلغاء آخر طلب
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredDrinks.map((drink, index) => {
                const maxQty = getMaxDrinkQty(drink)
                const outOfStock = maxQty === 0
                return (
                  <div
                    key={drink.id}
                    className={`group relative flex min-h-[100px] flex-col rounded-xl border-t-4 bg-white shadow-sm card-hover-lift animate-item-slide delay-${Math.min(index + 1, 12)} ${outOfStock ? 'opacity-60' : ''}`}
                    style={{ borderTopColor: drink.category === 'hot' ? 'var(--color-hot)' : 'var(--color-cold)' }}
                  >
                    <button
                      onClick={() => !isAdmin && addToCart(drink)}
                      disabled={outOfStock && !isAdmin}
                      className={`flex-1 flex flex-col w-full h-full p-4 text-right ${!isAdmin ? 'active-press' : ''} disabled:cursor-not-allowed`}
                    >
                      <div className="flex justify-between items-start w-full gap-2">
                        <span className="mb-4 text-sm font-semibold text-gray-800 dark:text-white leading-tight">{drink.name}</span>
                        {outOfStock && (
                          <span className="shrink-0 rounded bg-red-150 text-red-700 dark:bg-red-950/40 dark:text-red-300 px-1.5 py-0.5 text-[9px] font-bold">
                            نفذ
                          </span>
                        )}
                      </div>
                      <span className="mt-auto text-sm font-bold text-gray-600 dark:text-gray-400">{formatCurrency(drink.price)}</span>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (window.confirm(`هل أنت متأكد من حذف مشروب "${drink.name}" من المنيو بالكامل؟`)) {
                            deleteDrink(drink.id)
                          }
                        }}
                        className="absolute top-2 left-2 rounded-lg bg-red-50 dark:bg-red-950/20 p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-700 dark:hover:text-red-400 opacity-100 transition-opacity duration-200 shadow-sm"
                        title="حذف المشروب"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* OpenShiftModal removed */}

      {/* Reusable receipt modal replacing the old standard success modal */}
      <ReceiptModal
        isOpen={!!lastOrder}
        onClose={() => setLastOrder(null)}
        order={lastOrder}
      />
    </div>
  )
}
