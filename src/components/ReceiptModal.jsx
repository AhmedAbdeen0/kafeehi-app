import Modal from './Modal'
import { formatCurrency } from '../data/mockData'
import { Check, FileText } from 'lucide-react'

export default function ReceiptModal({ isOpen, onClose, order }) {
  if (!order) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="الفاتورة الإلكترونية الرقمية" size="sm">
      <div className="flex flex-col items-center text-center text-gray-800" dir="rtl">
        {/* Animated Checkmark Success Badge */}
        <div className="mb-4 flex flex-col items-center">
          <div className="checkmark">
            <svg className="w-[56px] h-[56px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
              <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>
          <span className="text-sm font-bold text-green-600 dark:text-green-400 mt-1">تم إتمام الفاتورة بنجاح</span>
        </div>

        {/* Receipt Paper Container */}
        <div className="relative w-full rounded-xl bg-cream dark:bg-sidebar/50 p-5 shadow-inner border border-cream-dark">
          {/* Header */}
          <div className="mb-4 border-b border-dashed border-cream-dark pb-4">
            <h3 className="text-xl font-bold text-sidebar dark:text-accent">كافيهي ☕</h3>
            <p className="text-xs text-gray-500">فاتورة دفع إلكترونية مبسطة</p>
          </div>

          {/* Details */}
          <div className="mb-4 space-y-1.5 text-right text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">رقم الفاتورة:</span>
              <span className="font-semibold text-gray-800">
                #{String(order.invoiceNumber || order.id.slice(-4)).padStart(4, '0')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">رقم الطاولة:</span>
              <span className="font-semibold text-gray-800">طاولة {order.tableNumber || 'سفري'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">التاريخ:</span>
              <span className="font-semibold text-gray-800">
                {new Date(order.completedAt || order.timestamp).toLocaleString('ar-EG')}
              </span>
            </div>
            {order.employeeName && (
              <div className="flex justify-between">
                <span className="text-gray-500">الكاشير:</span>
                <span className="font-semibold text-gray-800">{order.employeeName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">حالة الدفع:</span>
              <span className="flex items-center gap-1 font-bold text-green-600 dark:text-green-400">
                <Check size={12} />
                مدفوع
              </span>
            </div>
          </div>

          {/* Items List */}
          <div className="mb-4 border-t border-b border-dashed border-cream-dark py-3 text-right">
            <div className="mb-2 flex justify-between text-xs font-bold text-gray-500">
              <span>الصنف</span>
              <div className="flex gap-8">
                <span>الكمية</span>
                <span>الإجمالي</span>
              </div>
            </div>
            <ul className="space-y-2 text-xs">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span className="font-medium">{item.name}</span>
                  <div className="flex gap-9">
                    <span className="text-gray-500">×{item.qty}</span>
                    <span className="font-bold">{formatCurrency(item.price * item.qty)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Total Breakdown */}
          <div className="mb-4 space-y-1.5 text-right text-xs">
            <div className="flex justify-between text-sm font-bold">
              <span>الإجمالي الكلي:</span>
              <span className="text-sidebar dark:text-accent">{formatCurrency(order.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">المبلغ المدفوع:</span>
              <span>{formatCurrency(order.amountPaid || order.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">المتبقي (الباقي):</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(order.change || 0)}
              </span>
            </div>
          </div>


        </div>

        {/* Buttons */}
        <div className="mt-5 flex w-full gap-2">
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-cream-dark dark:border-white/10 hover:bg-cream dark:hover:bg-white/5 py-2 text-xs transition-colors"
          >
            <FileText size={14} />
            تصدير PDF / طباعة
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-accent py-2 text-xs font-semibold text-white hover:bg-accent-hover transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </Modal>
  )
}
