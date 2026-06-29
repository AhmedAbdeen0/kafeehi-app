export const UNIT_OPTIONS = ['جم', 'مل', 'قطعة', 'كجم', 'لتر']
export const CATEGORY_OPTIONS = [
  { value: 'hot', label: 'ساخن' },
  { value: 'cold', label: 'بارد' },
]

export function formatCurrency(amount) {
  return `${Number(amount).toFixed(2)} ج.م`
}

export function getArabicDate() {
  return new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
}

export function getStockStatus(quantity, alertLimit) {
  if (quantity <= alertLimit) return { label: 'منخفض', color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' }
  return { label: 'جيد', color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' }
}

export const TABLE_NUMBERS = Array.from({ length: 20 }, (_, i) => i + 1)

export const ORDER_STATUS_LABELS = {
  pending: 'قيد الانتظار',
  accepted: 'تم القبول',
  ready: 'جاهز',
  completed: 'مكتمل',
  cancelled: 'ملغي',
}

export const ORDER_STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200',
  accepted: 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200',
  ready: 'bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-200',
  completed: 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}
