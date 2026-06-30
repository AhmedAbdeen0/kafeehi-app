import { useState, useEffect, useRef } from 'react'
import { Bell, X, Check } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Modal from './Modal'
import ReceiptModal from './ReceiptModal'
import { formatCurrency, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../data/mockData'

export default function PendingOrdersPanel() {
  const {
    getPendingCustomerOrders,
    updateCustomerOrderStatus,
    completeCustomerOrder,
    cancelCustomerOrder,
    playChime,
    addToast,
  } = useApp()

  const pendingOrders = getPendingCustomerOrders()
  const [expanded, setExpanded] = useState(true)
  const [payOrder, setPayOrder] = useState(null)
  const [amountPaid, setAmountPaid] = useState('')
  const [completedReceipt, setCompletedReceipt] = useState(null)

  const prevPendingCount = useRef(pendingOrders.length)

  // Notify cashier with sound and toast when a new customer order arrives
  useEffect(() => {
    if (pendingOrders.length > prevPendingCount.current) {
      playChime()
      const latestOrder = pendingOrders[pendingOrders.length - 1]
      addToast(`وصل طلب جديد من طاولة ${latestOrder.tableNumber}! 🛎️`, 'info')
    }
    prevPendingCount.current = pendingOrders.length
  }, [pendingOrders, playChime, addToast])

  if (pendingOrders.length === 0) return null

  const handleComplete = async () => {
    if (!payOrder) return
    const paid = Number(amountPaid) || 0
    const result = await completeCustomerOrder(payOrder.id, paid)
    if (!result.success) {
      if (result.error === 'insufficient_payment') alert('المبلغ أقل من الإجمالي')
      else if (result.error === 'stock') {
        alert(`مخزون غير كافي:\n${result.shortages.map((s) => s.name).join(', ')}`)
      } else {
        alert(`فشل إتمام الطلب: ${result.message || 'حدث خطأ ما'}`)
      }
      return
    }
    // Show digital receipt
    setCompletedReceipt(result.order)
    setPayOrder(null)
    setAmountPaid('')
  }

  const handleCancelAll = async () => {
    if (!window.confirm('هل أنت متأكد من إلغاء جميع الطلبات الواردة الحالية؟')) return
    for (const order of pendingOrders) {
      try {
        await cancelCustomerOrder(order.id)
      } catch (err) {
        console.error(err)
      }
    }
  }

  return (
    <>
      <div className="border-b border-cream-dark bg-warning-bg transition-colors duration-300">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between px-6 py-3 text-sm font-semibold text-warning-text"
        >
          <span className="flex items-center gap-2">
            <Bell size={18} className="animate-bell-ring text-accent" />
            {pendingOrders.length} طلب وارد من الزبائن
          </span>
          <span className="text-xs">{expanded ? 'إخفاء' : 'عرض'}</span>
        </button>

        {expanded && (
          <div className="max-h-[350px] overflow-y-auto space-y-2 px-6 pb-4">
            <div className="flex justify-end pt-2 pb-1">
              <button
                onClick={handleCancelAll}
                className="rounded-lg bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-xs font-bold transition-all duration-200 shadow-sm"
              >
                إلغاء جميع الطلبات ({pendingOrders.length})
              </button>
            </div>
            {pendingOrders.map((order) => (
              <div key={order.id} className="rounded-xl border border-cream-dark bg-white p-4 transition-colors duration-300 shadow-sm">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="font-bold text-gray-900">
                      طاولة {order.tableNumber} — {order.customerName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.timestamp).toLocaleTimeString('ar-EG')}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>

                <ul className="mb-3 space-y-0.5 text-sm text-gray-600">
                  {order.items.map((item) => (
                    <li key={item.id}>{item.name} × {item.qty} — {formatCurrency(item.price * item.qty)}</li>
                  ))}
                </ul>

                <p className="mb-3 font-bold text-sidebar dark:text-accent">{formatCurrency(order.total)}</p>

                <div className="flex flex-wrap gap-2">
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateCustomerOrderStatus(order.id, 'accepted')}
                        className="rounded-lg bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 px-4 py-1.5 text-xs font-bold text-white transition-all duration-200"
                      >
                        قبول
                      </button>
                      <button
                        onClick={() => cancelCustomerOrder(order.id)}
                        className="rounded-lg border border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 px-4 py-1.5 text-xs font-semibold text-red-650 transition-all duration-200"
                      >
                        رفض
                      </button>
                    </>
                  )}
                  {order.status === 'accepted' && (
                    <button
                      onClick={() => updateCustomerOrderStatus(order.id, 'ready')}
                      className="rounded-lg bg-green-600 hover:bg-green-700 px-4 py-1.5 text-xs font-bold text-white transition-all duration-200"
                    >
                      جاهز
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button
                      onClick={() => {
                        setPayOrder(order)
                        setAmountPaid(String(order.total))
                      }}
                      className="rounded-lg bg-accent hover:bg-accent-hover px-4 py-1.5 text-xs font-bold text-white transition-all duration-200"
                    >
                      استلام فلوس وإغلاق
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pay Order Confirmation Modal */}
      <Modal
        isOpen={!!payOrder}
        onClose={() => { setPayOrder(null); setAmountPaid('') }}
        title={`دفع — طاولة ${payOrder?.tableNumber}`}
        size="sm"
      >
        {payOrder && (
          <div className="space-y-4" dir="rtl">
            <p className="text-lg font-bold">الإجمالي: {formatCurrency(payOrder.total)}</p>
            <div>
              <label className="mb-1.5 block text-sm font-medium">المبلغ المدفوع</label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-lg font-bold outline-none"
              />
            </div>
            {Number(amountPaid) >= payOrder.total && (
              <p className="font-bold text-green-700 dark:text-green-400">
                الباقي: {formatCurrency(Number(amountPaid) - payOrder.total)}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleComplete}
                disabled={Number(amountPaid) < payOrder.total}
                className="flex-1 rounded-lg bg-accent py-2.5 font-medium text-white disabled:opacity-50 hover:bg-accent-hover transition-colors"
              >
                تأكيد
              </button>
              <button
                onClick={() => { setPayOrder(null); setAmountPaid('') }}
                className="rounded-lg border border-cream-dark px-4 py-2.5 hover:bg-cream"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Digital Receipt Modal (Fatoora) displayed after complete payment */}
      <ReceiptModal
        isOpen={!!completedReceipt}
        onClose={() => setCompletedReceipt(null)}
        order={completedReceipt}
      />
    </>
  )
}
