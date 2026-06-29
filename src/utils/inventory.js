export function getRecipeNeeds(cartItems, drinks) {
  const needs = {}

  cartItems.forEach((item) => {
    const drink = drinks.find((d) => String(d.id) === String(item.id))
    if (!drink?.recipe?.length) return

    drink.recipe.forEach(({ inventoryId, amount }) => {
      const stringId = String(inventoryId)
      needs[stringId] = (needs[stringId] || 0) + amount * item.qty
    })
  })

  return needs
}

export function checkStock(cartItems, inventory, drinks) {
  const needs = getRecipeNeeds(cartItems, drinks)
  const shortages = []

  Object.entries(needs).forEach(([inventoryId, needed]) => {
    const item = inventory.find((i) => String(i.id) === String(inventoryId))
    if (!item) {
      shortages.push({ name: 'مكون غير معروف', needed, available: 0 })
      return
    }
    if (item.quantity < needed) {
      shortages.push({
        name: item.name,
        needed,
        available: item.quantity,
        unit: item.unit,
      })
    }
  })

  return shortages
}

export function deductStock(inventory, cartItems, drinks) {
  const needs = getRecipeNeeds(cartItems, drinks)

  return inventory.map((item) => {
    const deduct = needs[String(item.id)] || 0
    return deduct > 0 ? { ...item, quantity: Math.max(0, item.quantity - deduct) } : item
  })
}

export function restoreStock(inventory, cartItems, drinks) {
  const needs = getRecipeNeeds(cartItems, drinks)

  return inventory.map((item) => {
    const add = needs[String(item.id)] || 0
    return add > 0 ? { ...item, quantity: item.quantity + add } : item
  })
}

export function calcIngredientCost(recipe, inventory) {
  if (!recipe?.length) return 0
  return recipe.reduce((sum, { inventoryId, amount }) => {
    const item = inventory.find((i) => String(i.id) === String(inventoryId))
    return sum + (item ? item.unitCost * amount : 0)
  }, 0)
}

export function isDrinkInStock(drink, inventory, quantity = 1) {
  if (!drink?.recipe?.length) return true
  return drink.recipe.every(({ inventoryId, amount }) => {
    const item = inventory.find((i) => String(i.id) === String(inventoryId))
    return item && item.quantity >= amount * quantity
  })
}

export function getMaxDrinkQty(drink, inventory) {
  if (!drink?.recipe?.length) return Infinity
  let max = Infinity
  drink.recipe.forEach(({ inventoryId, amount }) => {
    const item = inventory.find((i) => String(i.id) === String(inventoryId))
    if (!item) {
      max = 0
      return
    }
    const possible = Math.floor(item.quantity / amount)
    if (possible < max) {
      max = possible
    }
  })
  return max === Infinity ? 99 : max
}
