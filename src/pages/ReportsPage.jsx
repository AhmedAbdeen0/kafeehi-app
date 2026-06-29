import { useState, useMemo, useEffect, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { formatCurrency } from '../data/mockData'
import { api } from '../utils/api'
import { BarChart3, Receipt, Coffee, Award, Calendar, FileText, Trash2 } from 'lucide-react'

const filters = [
  { key: 'today', label: 'اليوم' },
  { key: 'week', label: 'الأسبوع' },
  { key: 'month', label: 'الشهر' },
  { key: 'all', label: 'الكل' },
]

function getFilterDate(key) {
  const now = new Date()
  if (key === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }
  if (key === 'week') {
    const d = new Date(now)
    d.setDate(d.getDate() - 7)
    d.setHours(0, 0, 0, 0)
    return d
  }
  if (key === 'month') {
    const d = new Date(now)
    d.setMonth(d.getMonth() - 1)
    d.setHours(0, 0, 0, 0)
    return d
  }
  return null
}

const months = [
  { value: 1, label: 'يناير (1)' },
  { value: 2, label: 'فبراير (2)' },
  { value: 3, label: 'مارس (3)' },
  { value: 4, label: 'أبريل (4)' },
  { value: 5, label: 'مايو (5)' },
  { value: 6, label: 'يونيو (6)' },
  { value: 7, label: 'يوليو (7)' },
  { value: 8, label: 'أغسطس (8)' },
  { value: 9, label: 'سبتمبر (9)' },
  { value: 10, label: 'أكتوبر (10)' },
  { value: 11, label: 'نوفمبر (11)' },
  { value: 12, label: 'ديسمبر (12)' },
]

const years = [2026, 2025, 2024]

export default function ReportsPage() {
  const { orders, drinks, clearLocalOrders } = useApp()
  const [reportMode, setReportMode] = useState('monthly') // 'monthly' or 'currentShift'
  const [filter, setFilter] = useState('today')

  // Monthly Report states (from API)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [monthlyData, setMonthlyData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchMonthlyReport = useCallback(async (month, year) => {
    setLoading(true)
    setError('')
    try {
      const data = await api.get(`/api/report/Month/${month}/Year/${year}`)
      setMonthlyData(data)
    } catch (err) {
      setError(err.message || 'فشل تحميل التقرير من السيرفر')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (reportMode === 'monthly') {
      fetchMonthlyReport(selectedMonth, selectedYear)
    }
  }, [reportMode, selectedMonth, selectedYear, fetchMonthlyReport])

  // Current Shift calculations (local)
  const filteredOrders = useMemo(() => {
    const since = getFilterDate(filter)
    const salesOrders = orders.filter(
      (o) => o.type === 'counter' || !o.type || o.status === 'completed'
    )
    if (!since) return salesOrders
    return salesOrders.filter((o) => new Date(o.timestamp) >= since)
  }, [orders, filter])

  const stats = useMemo(() => {
    const totalSales = filteredOrders.reduce((s, o) => s + o.total, 0)
    const totalProfit = filteredOrders.reduce((s, o) => {
      const orderProfit = o.items.reduce((ps, item) => {
        const drink = drinks.find((d) => d.id === item.id)
        const cost = drink ? drink.ingredientCost : 0
        return ps + (item.price - cost) * item.qty
      }, 0)
      return s + orderProfit
    }, 0)
    const orderCount = filteredOrders.length
    const avgOrder = orderCount > 0 ? totalSales / orderCount : 0

    const byEmployee = {}
    filteredOrders.forEach((o) => {
      const name = o.employeeName || 'غير معروف'
      if (!byEmployee[name]) byEmployee[name] = { sales: 0, name }
      byEmployee[name].sales += o.total
    })

    const byCategory = {}
    filteredOrders.forEach((o) => {
      o.items.forEach((item) => {
        const drink = drinks.find((d) => d.id === item.id)
        const cat = drink?.category === 'hot' ? 'ساخن' : 'بارد'
        byCategory[cat] = (byCategory[cat] || 0) + item.price * item.qty
      })
    })

    const drinkSales = {}
    filteredOrders.forEach((o) => {
      o.items.forEach((item) => {
        drinkSales[item.name] = (drinkSales[item.name] || 0) + item.qty
      })
    })
    const topDrinks = Object.entries(drinkSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    return { totalSales, totalProfit, orderCount, avgOrder, byCategory, topDrinks, byEmployee }
  }, [filteredOrders, drinks])

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-cream text-gray-800 transition-colors duration-300 animate-page-fade">
      {/* Header */}
      <div className="border-b border-cream-dark bg-white px-8 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">التقارير والإحصائيات</h1>
            <p className="mt-1 text-sm text-gray-500">متابعة أداء المبيعات والأرباح والطلبات</p>
          </div>
          
          {/* Mode Switcher */}
          <div className="flex rounded-lg bg-cream p-1 border border-cream-dark">
            <button
              onClick={() => setReportMode('monthly')}
              className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-bold transition-all ${
                reportMode === 'monthly'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar size={16} />
              التقرير الشهري (السيرفر)
            </button>
            <button
              onClick={() => setReportMode('currentShift')}
              className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-bold transition-all ${
                reportMode === 'currentShift'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText size={16} />
              المبيعات الحالية (المحلي)
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6 px-8 py-6">
        {reportMode === 'monthly' ? (
          /* Monthly Report View */
          <div className="space-y-6">
            {/* Selectors */}
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-cream-dark bg-white p-4 shadow-sm">
              <span className="text-sm font-bold text-gray-700">اختر الفترة الزمنية للتقرير:</span>
              <div className="flex gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="rounded-lg border border-cream-dark bg-cream px-3 py-2 text-sm font-medium outline-none focus:border-accent"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="rounded-lg border border-cream-dark bg-cream px-3 py-2 text-sm font-medium outline-none focus:border-accent"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => fetchMonthlyReport(selectedMonth, selectedYear)}
                className="mr-auto rounded-lg bg-accent px-4 py-2 text-xs font-bold text-white hover:bg-accent-hover active-press"
              >
                تحديث البيانات 🔄
              </button>
            </div>

            {loading ? (
              <div className="space-y-6">
                {/* 4 Skeleton Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-xl border border-cream-dark bg-white p-5 shadow-sm space-y-3">
                      <div className="h-3 w-1/3 rounded skeleton-box"></div>
                      <div className="h-8 w-2/3 rounded skeleton-box"></div>
                      <div className="h-2.5 w-1/2 rounded skeleton-box"></div>
                    </div>
                  ))}
                </div>
                {/* Big Skeleton Box */}
                <div className="rounded-xl border border-cream-dark bg-white p-6 shadow-sm space-y-3">
                  <div className="h-4 w-1/4 rounded skeleton-box"></div>
                  <div className="h-3.5 w-full rounded skeleton-box"></div>
                  <div className="h-3 w-5/6 rounded skeleton-box"></div>
                </div>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
                <p className="text-sm font-medium text-red-800">{error}</p>
                <button
                  onClick={() => fetchMonthlyReport(selectedMonth, selectedYear)}
                  className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : monthlyData ? (
              <div className="space-y-6">
                {/* Main Monthly Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: 'إجمالي المبيعات', value: formatCurrency(monthlyData.totalPrice || 0), icon: <BarChart3 className="text-blue-500" size={24} />, desc: 'إجمالي دخل المبيعات للشهر' },
                    { label: 'عدد الطلبات المكتملة', value: monthlyData.totalOrder || 0, icon: <Receipt className="text-emerald-500" size={24} />, desc: 'عدد الفواتير المصدرة' },
                    { label: 'إجمالي المشروبات المباعة', value: monthlyData.totalDrink || 0, icon: <Coffee className="text-amber-500" size={24} />, desc: 'كمية الأكواب المباعة للزبائن' },
                    { label: 'المشروب الأكثر مبيعاً', value: monthlyData.drinkName || 'لا يوجد', icon: <Award className="text-purple-500" size={24} />, desc: 'المشروب الأعلى طلباً للشهر' },
                  ].map((card, index) => (
                    <div key={card.label} className={`flex items-start justify-between rounded-xl border border-cream-dark bg-white p-5 shadow-sm card-hover-lift animate-item-slide delay-${Math.min(index + 1, 12)}`}>
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-400">{card.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                        <p className="text-[10px] text-gray-400">{card.desc}</p>
                      </div>
                      <div className="rounded-lg bg-cream p-2">
                        {card.icon}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-cream-dark bg-white p-6 shadow-sm">
                  <h3 className="mb-2 text-sm font-bold text-gray-500">نظرة عامة على البيانات</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    تم استخراج هذه الإحصائيات مباشرة من قاعدة البيانات السحابية للسيرفر وتغطي الفواتير والطلبات المسجلة لشهر <strong>{months.find(m => m.value === selectedMonth)?.label}</strong> عام <strong>{selectedYear}</strong>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-gray-400">
                اختر شهراً وسنة ثم اضغط تحديث لعرض التقرير.
              </div>
            )}
          </div>
        ) : (
          /* Local Current Shift View */
          <div className="space-y-6">
            {/* Filter & Clear Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={clearLocalOrders}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-650 hover:bg-red-100 hover:text-red-700 transition-all active-press hover:scale-105 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-900/30"
                title="مسح جميع الفواتير المحلية المسجلة"
              >
                <Trash2 size={14} />
                <span>مسح الفواتير المحلية</span>
              </button>

              <div className="flex gap-2">
                {filters.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 active-press hover:scale-105 ${
                      filter === f.key
                        ? 'bg-accent text-white shadow-sm font-bold'
                        : 'border border-cream-dark bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'عدد الطلبات', value: stats.orderCount, color: '' },
                { label: 'إجمالي المبيعات', value: formatCurrency(stats.totalSales), color: '' },
                { label: 'إجمالي الربح', value: formatCurrency(stats.totalProfit), color: 'text-profit font-semibold' },
                { label: 'متوسط الطلب', value: formatCurrency(stats.avgOrder), color: '' },
              ].map((card, index) => (
                <div key={card.label} className={`rounded-xl border border-cream-dark bg-white px-5 py-4 shadow-sm card-hover-lift animate-item-slide delay-${Math.min(index + 1, 12)}`}>
                  <p className="text-xs font-bold text-gray-400">{card.label}</p>
                  <p className={`mt-2 text-2xl font-bold ${card.color}`}>{card.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Sales By Category */}
              <div className="rounded-xl border border-cream-dark bg-white p-5 shadow-sm card-hover-lift">
                <h3 className="mb-4 text-base font-bold text-gray-800 border-b pb-2 border-cream-dark">المبيعات حسب التصنيف</h3>
                {Object.keys(stats.byCategory).length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-400">لا توجد مبيعات مسجلة في هذه الفترة</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(stats.byCategory).map(([cat, amount]) => (
                      <div key={cat} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{cat}</span>
                        <span className="text-sm font-bold">{formatCurrency(amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top 5 Drinks */}
              <div className="rounded-xl border border-cream-dark bg-white p-5 shadow-sm card-hover-lift">
                <h3 className="mb-4 text-base font-bold text-gray-800 border-b pb-2 border-cream-dark">أكثر 5 مشروبات مبيعًا</h3>
                {stats.topDrinks.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-400">لا توجد مبيعات مسجلة في هذه الفترة</p>
                ) : (
                  <div className="space-y-3">
                    {stats.topDrinks.map(([name, qty], i) => (
                      <div key={name} className="flex items-center justify-between">
                        <span className="text-sm">
                          <span className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-cream text-xs font-bold">{i + 1}</span>
                          {name}
                        </span>
                        <span className="text-sm font-bold">{qty} كوب</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sales By Employee */}
            <div className="overflow-hidden rounded-xl border border-cream-dark bg-white shadow-sm">
              <div className="bg-tan px-5 py-3 border-b border-cream-dark">
                <h3 className="text-base font-bold text-gray-800">المبيعات حسب الموظف (الوردية الحالية)</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cream text-gray-500 font-bold border-b border-cream-dark">
                    <th className="px-4 py-3 text-right">الموظف</th>
                    <th className="px-4 py-3 text-right">المبيعات</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(stats.byEmployee).length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-4 py-12 text-center text-gray-400">
                        لا توجد مبيعات للموظفين في هذه الفترة
                      </td>
                    </tr>
                  ) : (
                    Object.entries(stats.byEmployee).map(([id, data]) => (
                      <tr key={id} className="border-t border-cream-dark hover:bg-cream/40 transition-colors duration-150">
                        <td className="px-4 py-3 font-medium">{data.name}</td>
                        <td className="px-4 py-3 font-bold">{formatCurrency(data.sales)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
