import { useState, useRef, useEffect } from 'react'
import { Bell, Check, X, CreditCard } from 'lucide-react'
import { useApp } from '../context/AppContext'
import {
  formatCurrency,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from '../data/mockData'
import Modal from '../components/Modal'
import ReceiptModal from '../components/ReceiptModal'

export default function TableOrdersPage() {
  const {
    getPendingCustomerOrders,
    updateCustomerOrderStatus,
    cancelCustomerOrder,
    completeCustomerOrder,
    invoiceCounter,
    playChime,
    addToast,
  } = useApp()

  const pendingOrders = getPendingCustomerOrders()
  const [payOrder, setPayOrder] = useState(null)
  const [amountPaid, setAmountPaid] = useState('')
  const [completedReceipt, setCompletedReceipt] = useState(null)

  const prevPendingCount = useRef(pendingOrders.length)

  // Sound chime notification on new order arrival
  useEffect(() => {
    if (pendingOrders.length > prevPendingCount.current) {
      playChime()
      const latestOrder = pendingOrders[pendingOrders.length - 1]
      addToast(`وصل طلب جديد من طاولة ${latestOrder.tableNumber}! 🛎️`, 'info')
    }
    prevPendingCount.current = pendingOrders.length
  }, [pendingOrders, playChime, addToast])

  const handleComplete = async () => {
    if (!payOrder) return
    const paid = Number(amountPaid) || 0
    const result = await completeCustomerOrder(payOrder.id, paid)
    if (!result.success) {
      if (result.error === 'insufficient_payment') alert('المبلغ أقل من الإجمالي')
      else if (result.error === 'stock') {
        alert(`مخزون غير كافي:\n${result.shortages.map((s) => s.name).join(', ')}`)
      } else {
        alert(`فشل إتمام الطلب: ${result.message || 'خطأ غير معروف'}`)
      }
      return
    }
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
    <div className="flex h-full flex-col overflow-y-auto bg-cream text-gray-800 transition-colors duration-300 animate-page-fade">
      {/* Header */}
      <div className="border-b border-cream-dark bg-white px-8 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              طلبات الطاولات
              {pendingOrders.length > 0 && (
                <span className="inline-flex h-6 px-2.5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white animate-pulse-glow">
                  {pendingOrders.length}
                </span>
              )}
            </h1>
            <p className="mt-1 text-sm text-gray-500">مراقبة وإدارة الطلبات الحية الواردة من طاولات الزبائن</p>
          </div>

          {pendingOrders.length > 0 && (
            <button
              onClick={handleCancelAll}
              className="rounded-xl bg-red-650 hover:bg-red-700 text-white px-4 py-2.5 text-xs font-bold transition-all duration-300 shadow-sm active-press hover:scale-105"
            >
              إلغاء جميع الطلبات ({pendingOrders.length})
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 px-8 py-6">
        {pendingOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 space-y-4">
            <div className="rounded-full bg-white p-6 shadow-sm border border-cream-dark">
              <Bell size={40} className="text-gray-300" />
            </div>
            <p className="font-medium">لا توجد أي طلبات واردة من الطاولات حالياً</p>
            <p className="text-xs text-gray-400">ستظهر الطلبات هنا فور إرسالها من الهواتف الخاصة بالزبائن</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingOrders.map((order, idx) => (
              <div
                key={order.id}
                className={`flex flex-col rounded-xl border border-cream-dark bg-white p-5 shadow-sm transition-all duration-300 card-hover-lift animate-item-slide delay-${Math.min(idx + 1, 12)}`}
              >
                {/* Header card details */}
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 leading-tight">
                      طاولة {order.tableNumber}
                    </h3>
                    <p className="text-xs text-accent font-semibold mt-0.5">
                      {order.customerName}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>

                <p className="text-[10px] text-gray-400 mb-3 border-b pb-2 border-cream-dark">
                  {new Date(order.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                </p>

                {/* Items List */}
                <ul className="mb-4 flex-1 space-y-1 text-sm text-gray-700">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex justify-between">
                      <span>{item.name} <span className="text-xs text-gray-400 font-bold">× {item.qty}</span></span>
                      <span className="font-medium text-gray-600">{formatCurrency(item.price * item.qty)}</span>
                    </li>
                  ))}
                </ul>

                {/* Total & Action Buttons */}
                <div className="mt-auto border-t border-cream-dark pt-3">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-gray-400">إجمالي الحساب:</span>
                    <span className="text-lg font-bold text-sidebar">{formatCurrency(order.total)}</span>
                  </div>

                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateCustomerOrderStatus(order.id, 'accepted')}
                          className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-2 text-xs font-bold transition-all duration-200 active-press hover:shadow-sm"
                        >
                          قبول الطلب
                        </button>
                        <button
                          onClick={() => cancelCustomerOrder(order.id)}
                          className="rounded-xl border border-red-200 hover:bg-red-50 text-red-650 px-3 py-2 text-xs font-bold transition-all duration-200 active-press"
                        >
                          رفض
                        </button>
                      </>
                    )}
                    {order.status === 'accepted' && (
                      <button
                        onClick={() => updateCustomerOrderStatus(order.id, 'ready')}
                        className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 text-white py-2.5 text-xs font-bold transition-all duration-200 active-press hover:shadow-sm"
                      >
                        تجهيز وإرسال تنبيه جاهز
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button
                        onClick={() => {
                          setPayOrder(order)
                          setAmountPaid(String(order.total))
                        }}
                        className="flex-1 rounded-xl bg-accent hover:bg-accent-hover text-white py-2.5 text-xs font-bold transition-all duration-200 active-press hover:shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <CreditCard size={14} />
                        استلام الحساب وإغلاق
                      </button>
                    )}
                  </div>
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
            <div className="flex justify-between items-center bg-cream p-3 rounded-lg border border-cream-dark">
              <span className="text-sm font-semibold">الإجمالي المطلوب:</span>
              <span className="text-xl font-bold text-sidebar">{formatCurrency(payOrder.total)}</span>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">المبلغ المدفوع</label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="w-full rounded-lg border border-cream-dark px-3 py-2.5 text-lg font-bold outline-none focus:border-accent"
                autoFocus
              />
            </div>
            {Number(amountPaid) >= payOrder.total && (
              <div className="flex justify-between items-center bg-green-50 text-green-700 px-3 py-2 rounded-lg font-bold border border-green-200">
                <span>الباقي للزبون:</span>
                <span>{formatCurrency(Number(amountPaid) - payOrder.total)}</span>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleComplete}
                disabled={Number(amountPaid) < payOrder.total}
                className="flex-1 rounded-lg bg-accent py-2.5 font-medium text-white disabled:opacity-50 hover:bg-accent-hover transition-colors"
              >
                تأكيد العملية
              </button>
              <button
                onClick={() => { setPayOrder(null); setAmountPaid('') }}
                className="rounded-lg border border-cream-dark px-4 py-2.5 hover:bg-cream"
              >
                إلغاء
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
    </div>
  )
}
