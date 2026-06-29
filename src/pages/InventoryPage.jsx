import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import { formatCurrency, getStockStatus, UNIT_OPTIONS } from '../data/mockData'

const emptyItem = { name: '', unit: 'جم', quantity: 0, alertLimit: 10, unitCost: 0 }

export default function InventoryPage() {
  const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, supplyInventoryItem } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [showSupplyModal, setShowSupplyModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [supplyId, setSupplyId] = useState(null)
  const [supplyAmount, setSupplyAmount] = useState('')
  const [form, setForm] = useState(emptyItem)

  const openNew = () => {
    setEditingId(null)
    setForm(emptyItem)
    setShowModal(true)
  }

  const openEdit = (item) => {
    setEditingId(item.id)
    setForm({ ...item })
    setShowModal(true)
  }

  const openSupply = (id) => {
    setSupplyId(id)
    setSupplyAmount('')
    setShowSupplyModal(true)
  }

  const handleSave = () => {
    if (!form.name) return
    const data = {
      ...form,
      quantity: Number(form.quantity),
      alertLimit: Number(form.alertLimit),
      unitCost: Number(form.unitCost),
    }
    if (editingId) {
      updateInventoryItem(editingId, data)
    } else {
      addInventoryItem(data)
    }
    setShowModal(false)
  }

  const handleSupply = () => {
    if (!supplyId || !supplyAmount) return
    supplyInventoryItem(supplyId, supplyAmount)
    setShowSupplyModal(false)
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto animate-page-fade">
      <div className="flex items-start justify-between border-b border-cream-dark bg-white px-8 py-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المخزون</h1>
          <p className="mt-1 text-sm text-gray-500">
            الخامات بتنقص أوتوماتيك مع كل عملية بيع
          </p>
        </div>
        <button
          onClick={openNew}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-all active-press hover:scale-[1.03]"
        >
          خامة جديدة
        </button>
      </div>

      <div className="flex-1 px-8 py-6">
        <div className="overflow-hidden rounded-xl border border-cream-dark bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream-dark text-gray-600">
                <th className="px-4 py-3 text-right font-medium">الخامة</th>
                <th className="px-4 py-3 text-right font-medium">الكمية المتاحة</th>
                <th className="px-4 py-3 text-right font-medium">تكلفة الوحدة</th>
                <th className="px-4 py-3 w-40"></th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item, index) => {
                const status = getStockStatus(item.quantity, item.alertLimit)
                return (
                  <tr key={item.id} className={`border-t border-cream-dark dark:border-white/5 animate-item-slide delay-${Math.min(index + 1, 12)} hover:bg-cream/40 dark:hover:bg-white/5 transition-colors duration-150`}>
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3">
                      <span>{item.quantity} {item.unit}</span>
                      <span className={`mr-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatCurrency(item.unitCost)} / {item.unit}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openSupply(item.id)}
                          className="rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 active-press hover:scale-105 transition-all"
                        >
                          تموين
                        </button>
                        <button onClick={() => openEdit(item)} className="rounded-lg border border-gray-200 dark:border-white/10 p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 active-press hover:scale-105 transition-all">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => deleteInventoryItem(item.id)} className="rounded-lg border border-gray-200 dark:border-white/10 p-1.5 text-red-400 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 active-press hover:scale-105 transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'تعديل خامة' : 'خامة جديدة'}>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">اسم الخامة</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">وحدة القياس</label>
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-accent"
            >
              {UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">الكمية الحالية</label>
              <input
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">حد التنبيه (منخفض عند)</label>
              <input
                type="number"
                value={form.alertLimit}
                onChange={(e) => setForm({ ...form, alertLimit: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">تكلفة الوحدة (ج.م)</label>
            <input
              type="number"
              step="0.01"
              value={form.unitCost}
              onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-medium text-white hover:bg-accent-hover">
              حفظ
            </button>
            <button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              إلغاء
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showSupplyModal} onClose={() => setShowSupplyModal(false)} title="تموين خامة">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">الكمية المضافة</label>
            <input
              type="number"
              value={supplyAmount}
              onChange={(e) => setSupplyAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-accent"
              placeholder="أدخل الكمية"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSupply} className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-medium text-white hover:bg-accent-hover">
              تموين
            </button>
            <button onClick={() => setShowSupplyModal(false)} className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              إلغاء
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
