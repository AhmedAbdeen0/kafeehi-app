const STORAGE_KEY = 'kafeehi_data'

function reviveDates(data) {
  if (!data) return null

  if (data.orders) {
    data.orders = data.orders.map((o) => ({
      ...o,
      timestamp: new Date(o.timestamp),
    }))
  }

  return data
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return reviveDates(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage full or unavailable
  }
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY)
}
