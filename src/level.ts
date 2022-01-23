import { MatchResult, OrderSide, OrderStatus } from './types'
import { fillOrder, Order } from './order'

export interface Level {
  orders: Order[]
  side: OrderSide
  price: number
  totalQty: number
}

export function createLevel(firstOrder: Order) {
  return {
    orders: [firstOrder],
    side: firstOrder.side,
    price: firstOrder.price,
    totalQty: firstOrder.qty,
  }
}

export function addOrderToLevel(level: Level, order: Order) {
  level.orders.push(order)
}

export function canMatch(level: Level, order: Order) {
  // Buy offer (bid) must higher/eq than the ask price.
  if (order.side === OrderSide.Bid) {
    return level.price <= order.price
  }

  // Sell offer (ask) must be lower/eq the bid price.
  return order.price <= level.price
}

export function matchOrder(
  level: Level,
  incomingOrder: Order,
  onRestingOrFilled: (orderId: number) => void
) {
  if (!canMatch(level, incomingOrder)) {
    return MatchResult.CannotMatch
  }

  let matchResult = MatchResult.Continuation
  let removeCount = 0

  for (const restingOrder of level.orders) {
    // It's not efficient to try and find or remove
    // cancelled orders from levels, so we skip over
    // them and pop them off from our "deque" when
    // encountered instead.
    if (restingOrder.status === OrderStatus.Cancelled) {
      removeCount += 1
      continue
    }

    const qtyToFill = Math.min(restingOrder.qtyLeft, incomingOrder.qtyLeft)

    fillOrder(incomingOrder, qtyToFill, level.price)
    fillOrder(restingOrder, qtyToFill, level.price)

    if (restingOrder.status === OrderStatus.Filled) {
      onRestingOrFilled(restingOrder.orderId)
      removeCount += 1
    }

    // Order is filled, matching is complete.
    if (incomingOrder.status === OrderStatus.Filled) {
      matchResult = MatchResult.Complete
      break
    }
  }

  // Remove matched orders.
  if (removeCount > 0) {
    level.orders = level.orders.splice(removeCount)
  }

  return matchResult
}
