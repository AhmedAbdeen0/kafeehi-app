import { useState } from 'react'
import { Pencil, Ban, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import { formatCurrency, CATEGORY_OPTIONS } from '../data/mockData'

const emptyDrink = { name: '', category: 'hot', price: '', ingredientCost: 0, recipe: [] }

export default function MenuPage() {
  const { drinks, addDrink, updateDrink, deleteDrink, toggleDrink, inventory } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyDrink)
  const [expandedCategories, setExpandedCategories] = useState({ hot: true, cold: true })

  // Recipe selection states
  const [selectedIngId, setSelectedIngId] = useState('')
  const [ingAmount, setIngAmount] = useState('')

  const hotDrinks = drinks.filter((d) => d.category === 'hot')
  const coldDrinks = drinks.filter((d) => d.category === 'cold')

  const openNew = () => {
    setEditingId(null)
    setForm(emptyDrink)
    setSelectedIngId('')
    setIngAmount('')
    setShowModal(true)
  }

  const openEdit = (drink) => {
    setEditingId(drink.id)
    setForm({ ...emptyDrink, ...drink, recipe: drink.recipe || [] })
    setSelectedIngId('')
    setIngAmount('')
    setShowModal(true)
  }

  const handleSave = () => {
    if (!form.name || !form.price) return
    const data = {
      ...form,
      price: Number(form.price),
      ingredientCost: Number(form.ingredientCost) || 0,
      recipe: form.recipe || []
    }
    if (editingId) {
      updateDrink(editingId, data)
    } else {
      addDrink(data)
    }
    setShowModal(false)
  }

  const addIngredientToRecipe = () => {
    if (!selectedIngId || !ingAmount) return
    const ingredient = inventory.find((i) => String(i.id) === String(selectedIngId))
    if (!ingredient) return

    const newRecipeItem = {
      inventoryId: String(selectedIngId),
      amount: Number(ingAmount),
    }

    const currentRecipe = form.recipe || []
    const existingIndex = currentRecipe.findIndex(
      (r) => String(r.inventoryId) === String(selectedIngId)
    )

    let updatedRecipe = []
    if (existingIndex > -1) {
      updatedRecipe = currentRecipe.map((r, idx) =>
        idx === existingIndex ? newRecipeItem : r
      )
    } else {
      updatedRecipe = [...currentRecipe, newRecipeItem]
    }

    const calculatedCost = updatedRecipe.reduce((sum, rItem) => {
      const invItem = inventory.find((i) => String(i.id) === String(rItem.inventoryId))
      return sum + (invItem ? invItem.unitCost * rItem.amount : 0)
    }, 0)

    setForm((prev) => ({
      ...prev,
      recipe: updatedRecipe,
      ingredientCost: calculatedCost,
    }))

    setSelectedIngId('')
    setIngAmount('')
  }

  const removeIngredientFromRecipe = (id) => {
    const currentRecipe = form.recipe || []
    const updatedRecipe = currentRecipe.filter(
      (r) => String(r.inventoryId) !== String(id)
    )

    const calculatedCost = updatedRecipe.reduce((sum, rItem) => {
      const invItem = inventory.find((i) => String(i.id) === String(rItem.inventoryId))
      return sum + (invItem ? invItem.unitCost * rItem.amount : 0)
    }, 0)

    setForm((prev) => ({
      ...prev,
      recipe: updatedRecipe,
      ingredientCost: calculatedCost,
    }))
  }

  const toggleCategory = (cat) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }))
  }

  const renderCategory = (title, icon, categoryDrinks, catKey) => (
    <div className="mb-6">
      <button
        onClick={() => toggleCategory(catKey)}
        className="mb-3 flex w-full items-center gap-2 text-base font-bold text-gray-800"
      >
        <span>{icon}</span>
        <span>{title}</span>
        {expandedCategories[catKey] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {expandedCategories[catKey] && (
        <div className="overflow-hidden rounded-xl border border-cream-dark bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream-dark text-gray-600">
                <th className="px-4 py-3 text-right font-medium">الاسم</th>
                <th className="px-4 py-3 text-right font-medium">السعر</th>
                <th className="px-4 py-3 text-right font-medium">تكلفة المكونات</th>
                <th className="px-4 py-3 text-right font-medium">هامش الربح</th>
                <th className="px-4 py-3 w-28"></th>
              </tr>
            </thead>
            <tbody>
              {categoryDrinks.map((drink, index) => {
                const profit = drink.price - drink.ingredientCost
                return (
                  <tr key={drink.id} className={`border-t border-cream-dark dark:border-white/5 animate-item-slide delay-${Math.min(index + 1, 12)} ${!drink.enabled ? 'opacity-50' : ''} hover:bg-cream/40 dark:hover:bg-white/5 transition-colors duration-150`}>
                    <td className="px-4 py-3 font-medium">{drink.name}</td>
                    <td className="px-4 py-3">{formatCurrency(drink.price)}</td>
                    <td className="px-4 py-3">{formatCurrency(drink.ingredientCost)}</td>
                    <td className="px-4 py-3 font-medium text-profit">{formatCurrency(profit)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(drink)} className="rounded-lg border border-gray-200 dark:border-white/10 p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 active-press hover:scale-105 transition-all">
                           <Pencil size={14} />
                        </button>
                        <button onClick={() => toggleDrink(drink.id)} className="rounded-lg border border-gray-200 dark:border-white/10 p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 active-press hover:scale-105 transition-all">
                           <Ban size={14} />
                        </button>
                        <button onClick={() => deleteDrink(drink.id)} className="rounded-lg border border-gray-200 dark:border-white/10 p-1.5 text-red-400 dark:text-red-450 hover:bg-red-50 dark:hover:bg-red-950/20 active-press hover:scale-105 transition-all">
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
      )}
    </div>
  )

  return (
    <div className="flex h-full flex-col overflow-y-auto animate-page-fade">
      <div className="flex items-start justify-between border-b border-cream-dark bg-white px-8 py-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المنيو</h1>
          <p className="mt-1 text-sm text-gray-500">
            {drinks.length} مشروب — إدارة الأسعار والوصفات وحساب الربح
          </p>
        </div>
        <button
          onClick={openNew}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-all active-press hover:scale-[1.03]"
        >
          مشروب جديد
        </button>
      </div>

      <div className="flex-1 px-8 py-6">
        {renderCategory('مشروبات ساخنة', '☕', hotDrinks, 'hot')}
        {renderCategory('مشروبات باردة', '🧊', coldDrinks, 'cold')}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'تعديل مشروب' : 'مشروب جديد'} size="lg">
        <div className="space-y-4 text-right" dir="rtl">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">اسم المشروب</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-accent text-right"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 text-right">التصنيف</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-accent text-right"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 text-right">السعر (ج.م)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-accent text-right"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 text-right">تكلفة المكونات (ج.م)</label>
            <input
              type="number"
              value={form.ingredientCost}
              onChange={(e) => setForm({ ...form, ingredientCost: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-accent text-right"
              disabled={(form.recipe || []).length > 0}
              title={(form.recipe || []).length > 0 ? "يتم حساب التكلفة تلقائياً من الوصفة بالأسفل" : ""}
            />
          </div>

          {/* Recipe Builder UI */}
          <div className="border-t border-cream-dark pt-4">
            <h3 className="mb-2 text-sm font-bold text-gray-800 text-right">وصفة المكونات من المخزن (يربط المشروب بالمخزن)</h3>
            
            {(form.recipe || []).length > 0 ? (
              <div className="mb-3 space-y-2">
                {form.recipe.map((rItem) => {
                  const invItem = inventory.find((i) => String(i.id) === String(rItem.inventoryId))
                  if (!invItem) return null
                  const itemCost = invItem.unitCost * rItem.amount
                  return (
                    <div key={rItem.inventoryId} className="flex items-center justify-between rounded-lg bg-cream px-3 py-2 text-xs border border-cream-dark">
                      <div>
                        <span className="font-semibold text-gray-800">{invItem.name}</span>
                        <span className="mx-2 text-gray-300">|</span>
                        <span className="text-gray-600">الكمية: {rItem.amount} {invItem.unit}</span>
                        <span className="mx-2 text-gray-300">|</span>
                        <span className="text-gray-500">التكلفة: {formatCurrency(itemCost)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeIngredientFromRecipe(rItem.inventoryId)}
                        className="text-red-500 hover:text-red-700 font-bold px-1.5 transition-colors"
                      >
                        حذف
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="mb-3 text-xs text-red-650 dark:text-red-400 font-semibold text-right leading-relaxed bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-900/50 animate-pulse">
                ⚠️ يجب إضافة مكون واحد على الأقل للمشروب! اختر خامة وحدد كميتها، ثم اضغط على زر "إضافة" بالأسفل، وبعدها اضغط على حفظ.
              </p>
            )}

            <div className="flex gap-2">
              <select
                value={selectedIngId}
                onChange={(e) => setSelectedIngId(e.target.value)}
                className="flex-1 rounded-lg border border-gray-200 px-2 py-2 text-xs outline-none focus:border-accent text-right"
              >
                <option value="">-- اختر خامة من المخزن --</option>
                {inventory.map((inv) => (
                  <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                step="any"
                value={ingAmount}
                onChange={(e) => setIngAmount(e.target.value)}
                placeholder="الكمية"
                className="w-20 rounded-lg border border-gray-200 px-2 py-2 text-xs text-center outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={addIngredientToRecipe}
                disabled={!selectedIngId || !ingAmount}
                className="rounded-lg bg-accent px-4 py-2 text-xs font-bold text-white hover:bg-accent-hover disabled:bg-gray-350 disabled:cursor-not-allowed transition-colors"
              >
                إضافة
              </button>
            </div>
          </div>

          <div className="rounded-lg bg-cream px-4 py-3 text-sm text-gray-650 text-right border border-cream-dark">
            تكلفة المكونات الإجمالية: {formatCurrency(form.ingredientCost || 0)} — هامش الربح:{' '}
            <span className="font-bold text-profit">
              {formatCurrency((Number(form.price) || 0) - (Number(form.ingredientCost) || 0))}
            </span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={!form.name || !form.price || !form.recipe || form.recipe.length === 0}
              className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-bold text-white hover:bg-accent-hover transition-colors active-press disabled:opacity-50 disabled:cursor-not-allowed"
            >
              حفظ
            </button>
            <button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-bold text-gray-750 hover:bg-gray-50 transition-colors active-press">
              إلغاء
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
