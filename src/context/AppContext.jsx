import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { loadState, saveState, clearState } from '../utils/storage'
import { checkStock, deductStock, restoreStock, isDrinkInStock, getMaxDrinkQty } from '../utils/inventory'
import { playNotificationChime } from '../utils/sound'
import { useAuth } from './AuthContext'
import { api } from '../utils/api'

const AppContext = createContext(null)

function isGuid(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function parseCustomerName(o) {
  if (!o) return 'زبون';
  
  // 1. Try direct string properties
  const possibleNames = [
    o.customerName,
    o.userName,
    o.name,
    o.email,
    o.customerEmail,
    o.userEmail
  ];
  
  for (const name of possibleNames) {
    if (name && typeof name === 'string' && name.trim() !== '' && !isGuid(name)) {
      return name.trim();
    }
  }

  // 2. Try nested customer or user objects
  const userObj = o.customer || o.user;
  if (userObj) {
    if (typeof userObj === 'string' && userObj.trim() !== '' && !isGuid(userObj)) {
      return userObj.trim();
    }
    
    if (typeof userObj === 'object') {
      const nestedName = userObj.name || userObj.userName || userObj.username || userObj.email;
      if (nestedName && typeof nestedName === 'string' && nestedName.trim() !== '') {
        if (isGuid(nestedName)) {
          const email = userObj.email || o.email;
          if (email && typeof email === 'string' && email.includes('@')) {
            return email.split('@')[0];
          }
        } else {
          return nestedName.trim();
        }
      }
    }
  }

  // 3. Fallback to GUID handling on any string field that is a GUID
  for (const name of possibleNames) {
    if (name && typeof name === 'string' && isGuid(name)) {
      const email = o.email || o.customerEmail || o.userEmail || o.customer?.email || o.user?.email;
      if (email && typeof email === 'string' && email.includes('@')) {
        return email.split('@')[0];
      }
      return name.trim();
    }
  }

  return 'زبون';
}

function getInitialState() {
  const saved = loadState()
  if (saved) {
    return {
      ...saved,
      drinks: [],
      inventory: [],
    }
  }

  return {
    drinks: [],
    inventory: [],
    orders: [],
    invoiceCounter: 1,
  }
}

export function AppProvider({ children }) {
  const initial = getInitialState()
  const [drinks, setDrinks] = useState(initial.drinks)
  const [inventory, setInventory] = useState(initial.inventory)
  const [orders, setOrders] = useState(initial.orders)
  const [invoiceCounter, setInvoiceCounter] = useState(initial.invoiceCounter || 1)
  const [toasts, setToasts] = useState([])
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark')
  const [syncError, setSyncError] = useState(null)

  const { user } = useAuth()

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev
      localStorage.setItem('theme', next ? 'dark' : 'light')
      return next
    })
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    saveState({
      orders,
      invoiceCounter,
    })
  }, [orders, invoiceCounter])

  const fetchDrinks = useCallback(async () => {
    try {
      const data = await api.get('/api/drinks')
      if (data) {
        const mapped = data.map(d => ({
          ...d,
          id: d.id || d._id,
          enabled: d.enabled !== false,
          recipe: (d.recipeDtos || []).map(r => ({
            inventoryId: String(r.inventoryItemId),
            amount: Number(r.amount)
          }))
        }))
        setDrinks(mapped)
      }
    } catch (err) {
      console.error('Failed to fetch drinks from API:', err)
    }
  }, [])

  const fetchInventory = useCallback(async () => {
    try {
      const data = await api.get('/api/inventory')
      if (data) {
        const mapped = data.map(i => ({
          ...i,
          id: i.id || i._id,
        }))
        setInventory(mapped)
      }
    } catch (err) {
      console.error('Failed to fetch inventory from API:', err)
    }
  }, [])

  const fetchPendingOrders = useCallback(async () => {
    try {
      const data = await api.get('/api/order/customer/pending')
      if (data) {
        setSyncError(null)
        const mapped = data.map(o => {
          const orderItems = o.items || [];
          return {
            id: String(o.id),
            type: 'customer',
            tableNumber: o.tableNumber,
            status: String(o.status || 'pending').toLowerCase(),
            customerId: String(o.customerId || o.userId || o.customer?.id || o.user?.id || ''),
            customerName: parseCustomerName(o),
            timestamp: o.createdAt ? new Date(o.createdAt) : new Date(),
            items: orderItems.map(item => ({
              id: String(item.idDrink || item.id),
              name: item.name,
              price: Number(item.price || 0),
              qty: Number(item.qty || 0)
            })),
            total: orderItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0)
          };
        });
        setOrders((prev) => {
          // Keep track of active customer orders in prev that did not come back in mapped.
          // Since they are no longer in the pending list on the server, they must have been completed or cancelled.
          const updatedPrev = prev.map((o) => {
            if (o.type === 'customer' && ['pending', 'accepted', 'ready'].includes(o.status)) {
              const isStillPending = mapped.some((mo) => mo.id === o.id);
              if (!isStillPending) {
                // If it was 'ready', it means the cashier clicked complete and received payment.
                // Otherwise, it was rejected/cancelled.
                return {
                  ...o,
                  status: o.status === 'ready' ? 'completed' : 'cancelled',
                  completedAt: new Date(),
                };
              }
            }
            return o;
          });

          const nonCustomer = updatedPrev.filter(o => o.type !== 'customer' || o.status === 'completed' || o.status === 'cancelled');
          return [...nonCustomer, ...mapped];
        });
      }
    } catch (err) {
      console.error('Failed to fetch pending customer orders:', err);
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchDrinks()
      if (user.role === 'admin') {
        fetchInventory()
      } else {
        fetchPendingOrders()
      }

      const interval = setInterval(() => {
        if (user.role !== 'admin') {
          fetchPendingOrders()
        }
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [user, fetchDrinks, fetchInventory, fetchPendingOrders])

  const addDrink = useCallback(async (drink) => {
    try {
      const payload = {
        name: drink.name,
        category: drink.category,
        price: Number(drink.price),
        ingredientCost: Number(drink.ingredientCost) || 0,
        recipeDtos: (drink.recipe || []).map(r => ({
          inventoryItemId: Number(r.inventoryId),
          amount: Number(r.amount)
        }))
      }
      const newDrink = await api.post('/api/drinks', payload)
      const mapped = {
        ...newDrink,
        id: newDrink.id || newDrink._id,
        enabled: newDrink.enabled !== false,
        recipe: (newDrink.recipeDtos || []).map(r => ({
          inventoryId: String(r.inventoryItemId),
          amount: Number(r.amount)
        }))
      }
      setDrinks((prev) => [...prev, mapped])
      addToast('تم إضافة المشروب بنجاح', 'success')
    } catch (err) {
      console.error(err)
      addToast(`فشل إضافة المشروب: ${err.message}`, 'error')
    }
  }, [addToast])

  const updateDrink = useCallback(async (id, data) => {
    try {
      const payload = {
        name: data.name,
        category: data.category,
        price: Number(data.price),
        ingredientCost: Number(data.ingredientCost) || 0,
        recipeDtos: (data.recipe || []).map(r => ({
          inventoryItemId: Number(r.inventoryId),
          amount: Number(r.amount)
        }))
      }
      const updated = await api.put(`/api/drinks/${id}`, payload)
      const mapped = {
        ...updated,
        id: updated.id || updated._id,
        enabled: updated.enabled !== false,
        recipe: (updated.recipeDtos || []).map(r => ({
          inventoryId: String(r.inventoryItemId),
          amount: Number(r.amount)
        }))
      }
      setDrinks((prev) => prev.map((d) => (d.id === id || d._id === id ? mapped : d)))
      addToast('تم تعديل المشروب بنجاح', 'success')
    } catch (err) {
      console.error(err)
      addToast(`فشل تعديل المشروب: ${err.message}`, 'error')
    }
  }, [addToast])

  const deleteDrink = useCallback(async (id) => {
    try {
      await api.delete(`/api/drinks/${id}`)
      setDrinks((prev) => prev.filter((d) => d.id !== id && d._id !== id))
      addToast('تم حذف المشروب بنجاح', 'success')
    } catch (err) {
      console.error(err)
      addToast(`فشل حذف المشروب: ${err.message}`, 'error')
    }
  }, [addToast])

  const toggleDrink = useCallback(async (id) => {
    const drink = drinks.find((d) => d.id === id || d._id === id)
    if (!drink) return
    const nextStatus = !(drink.enabled !== false)
    try {
      await api.patch(`/api/drinks/${id}/${nextStatus}`)
      setDrinks((prev) =>
        prev.map((d) => (d.id === id || d._id === id ? { ...d, enabled: nextStatus } : d))
      )
      addToast('تم تعديل حالة المشروب', 'success')
    } catch (err) {
      console.error(err)
      addToast(`فشل تعديل حالة المشروب: ${err.message}`, 'error')
    }
  }, [drinks, addToast])

  const addInventoryItem = useCallback(async (item) => {
    try {
      const newItem = await api.post('/api/inventory', {
        name: item.name,
        unit: item.unit,
        quantity: Number(item.quantity),
        alertLimit: Number(item.alertLimit),
        unitCost: Number(item.unitCost),
      })
      const mapped = { ...newItem, id: newItem.id || newItem._id }
      setInventory((prev) => [...prev, mapped])
      addToast('تم إضافة المادة للمخزن بنجاح', 'success')
    } catch (err) {
      console.error(err)
      addToast(`فشل إضافة المادة: ${err.message}`, 'error')
    }
  }, [addToast])

  const updateInventoryItem = useCallback(async (id, data) => {
    try {
      const updated = await api.put(`/api/inventory/${id}`, {
        alertLimit: Number(data.alertLimit),
      })
      setInventory((prev) =>
        prev.map((i) => (i.id === id || i._id === id ? { ...i, ...data, alertLimit: updated.alertLimit || Number(data.alertLimit) } : i))
      )
      addToast('تم تعديل حد التنبيه بنجاح', 'success')
    } catch (err) {
      console.error(err)
      addToast(`فشل تعديل حد التنبيه: ${err.message}`, 'error')
    }
  }, [addToast])

  const deleteInventoryItem = useCallback(async (id) => {
    try {
      await api.delete(`/api/inventory/${id}`)
      setInventory((prev) => prev.filter((i) => i.id !== id && i._id !== id))
      addToast('تم حذف المادة بنجاح', 'success')
    } catch (err) {
      console.error(err)
      addToast(`فشل حذف المادة: ${err.message}`, 'error')
    }
  }, [addToast])

  const supplyInventoryItem = useCallback(async (id, amount) => {
    try {
      const updated = await api.post(`/api/inventory/${id}/supply`, {
        amount: Number(amount)
      })
      const mapped = { ...updated, id: updated.id || updated._id }
      setInventory((prev) =>
        prev.map((i) => (i.id === id || i._id === id ? mapped : i))
      )
      addToast('تم تموين المادة بنجاح', 'success')
    } catch (err) {
      console.error(err)
      addToast(`فشل تموين المادة: ${err.message}`, 'error')
    }
  }, [addToast])

  const completeOrder = useCallback(async (cartItems, paymentMethod, total, amountPaid) => {
    if (cartItems.length === 0) return { success: false, error: 'empty_cart' }
    if (amountPaid < total) return { success: false, error: 'insufficient_payment' }

    const items = cartItems.map(item => ({
      idDrink: Number(item.id || item._id),
      name: item.name,
      price: Number(item.price),
      qty: Number(item.qty)
    }));

    try {
      const res = await api.post('/api/order/counter', {
        items,
        amountPaid: Number(amountPaid),
        paymentMethod
      });

      const invoiceNumber = invoiceCounter
      const order = {
        id: res.orderId ? String(res.orderId) : Date.now().toString(),
        type: 'counter',
        invoiceNumber,
        items: cartItems,
        total,
        amountPaid,
        change: res.change !== undefined ? res.change : (amountPaid - total),
        paymentMethod,
        employeeId: user?.id || 'unknown',
        employeeName: res.employeeName || user?.name || 'كاشير',
        timestamp: new Date(),
      }

      setOrders((prev) => [...prev, order])
      setInvoiceCounter((prev) => prev + 1)
      fetchInventory()

      return { success: true, order }
    } catch (err) {
      console.error(err)
      return { success: false, error: 'api_failed', message: err.message }
    }
  }, [invoiceCounter, user, fetchInventory])

  const undoLastOrder = useCallback(() => {
    const lastOrder = [...orders].reverse().find((o) => o.type === 'counter')
    if (!lastOrder) return false

    setInventory((prev) => restoreStock(prev, lastOrder.items, drinks))
    setOrders((prev) => prev.filter((o) => o.id !== lastOrder.id))
    setInvoiceCounter((prev) => Math.max(1, prev - 1))
    return true
  }, [orders, drinks])

  const submitCustomerOrder = useCallback(async (cartItems, tableNumber, customerId, customerName) => {
    if (!tableNumber || cartItems.length === 0) {
      return { success: false, error: 'invalid' }
    }

    const total = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0)
    const items = cartItems.map(item => ({
      idDrink: Number(item.id || item._id),
      name: item.name,
      price: Number(item.price),
      qty: Number(item.qty)
    }));

    try {
      const res = await api.post('/api/order/customer', {
        tableNumber: Number(tableNumber),
        items,
        amountPaid: 0,
        paymentMethod: 'cash'
      });

      const order = {
        id: res.orderId ? String(res.orderId) : Date.now().toString(),
        type: 'customer',
        tableNumber: Number(tableNumber),
        customerId,
        customerName,
        items: cartItems,
        total,
        status: String(res.status || 'pending').toLowerCase(),
        timestamp: new Date(),
      }

      setOrders((prev) => [...prev, order])
      return { success: true, order }
    } catch (err) {
      console.error(err)
      return { success: false, error: 'api_failed', message: err.message }
    }
  }, [])

  const updateCustomerOrderStatus = useCallback(async (orderId, status) => {
    try {
      const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);
      await api.put(`/api/order/customer/${orderId}/status`, { status: capitalizedStatus })
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId || o._id === orderId ? { ...o, status } : o))
      )
      addToast('تم تحديث حالة الطلب بنجاح', 'success')
    } catch (err) {
      console.error(err)
      addToast(`فشل تحديث حالة الطلب: ${err.message}`, 'error')
    }
  }, [addToast])

  const completeCustomerOrder = useCallback(async (orderId, amountPaid) => {
    const order = orders.find((o) => o.id === orderId || o._id === orderId)
    if (!order || order.type !== 'customer') return { success: false, error: 'not_found' }
    if (order.status === 'completed' || order.status === 'cancelled') {
      return { success: false, error: 'already_done' }
    }
    if (amountPaid < order.total) return { success: false, error: 'insufficient_payment' }

    try {
      await api.put(`/api/order/customer/${orderId}/status`, {
        status: 'Completed'
      })

      const invoiceNumber = invoiceCounter
      const completed = {
        ...order,
        status: 'completed',
        invoiceNumber,
        amountPaid,
        change: amountPaid - order.total,
        paymentMethod: 'cash',
        employeeId: user?.id || 'unknown',
        employeeName: user?.name || 'كاشير',
        completedAt: new Date(),
      }

      setOrders((prev) => prev.map((o) => (o.id === orderId || o._id === orderId ? completed : o)))
      setInvoiceCounter((prev) => prev + 1)
      fetchInventory()

      return { success: true, order: completed }
    } catch (err) {
      console.error(err)
      return { success: false, error: 'api_failed', message: err.message }
    }
  }, [orders, invoiceCounter, user, fetchInventory])

  const cancelCustomerOrder = useCallback(async (orderId) => {
    try {
      await api.put(`/api/order/customer/${orderId}/status`, { status: 'Cancelled' })
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId || o._id === orderId ? { ...o, status: 'cancelled' } : o))
      )
      addToast('تم إلغاء الطلب بنجاح', 'success')
    } catch (err) {
      console.error(err)
      addToast(`فشل إلغاء الطلب: ${err.message}`, 'error')
    }
  }, [addToast])

  const getCustomerOrders = useCallback((customerId) => {
    return orders.filter((o) => o.type === 'customer' && String(o.customerId) === String(customerId))
  }, [orders])

  const getPendingCustomerOrders = useCallback(() => {
    return orders.filter(
      (o) => o.type === 'customer' && ['pending', 'accepted', 'ready'].includes(o.status) && o.items && o.items.length > 0
    )
  }, [orders])

  const checkCartStock = useCallback((cartItems) => {
    if (user?.role !== 'admin') return []
    return checkStock(cartItems, inventory, drinks)
  }, [user, inventory, drinks])

  const clearLocalOrders = useCallback(() => {
    if (!window.confirm('هل أنت متأكد من مسح جميع الفواتير المحلية المسجلة؟')) return
    setOrders([])
    setInvoiceCounter(1)
    addToast('تم مسح الفواتير المحلية بنجاح', 'success')
  }, [addToast])

  const resetData = useCallback(() => {
    if (!window.confirm('هل أنت متأكد من إعادة ضبط كل البيانات؟')) return
    clearState()
    setDrinks([])
    setInventory([])
    setOrders([])
    setInvoiceCounter(1)
  }, [])

  return (
    <AppContext.Provider
      value={{
        drinks,
        inventory,
        orders,
        invoiceCounter,
        addDrink,
        updateDrink,
        deleteDrink,
        toggleDrink,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        supplyInventoryItem,
        completeOrder,
        undoLastOrder,
        checkCartStock,
        submitCustomerOrder,
        updateCustomerOrderStatus,
        completeCustomerOrder,
        cancelCustomerOrder,
        getCustomerOrders,
        getPendingCustomerOrders,
        clearLocalOrders,
        resetData,
        toasts,
        addToast,
        removeToast,
        darkMode,
        toggleDarkMode,
        playChime: playNotificationChime,
        isDrinkInStock: (drink, quantity) => {
          if (user?.role !== 'admin') return true
          return isDrinkInStock(drink, inventory, quantity)
        },
        getMaxDrinkQty: (drink) => {
          if (user?.role !== 'admin') return 99
          return getMaxDrinkQty(drink, inventory)
        },
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
