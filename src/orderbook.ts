import { RBTree } from 'bintrees'

import { addOrderToLevel, createLevel, Level, matchOrder } from './level'
import { createOrder, Order } from './order'
import { MatchResult, OrderSide, OrderStatus } from './types'

export enum AddResult {
  Filled,
  Resting,
}

export interface Orderbook {
  bids: RBTree<Level>
  asks: RBTree<Level>
  bestBid: number
  bestAsk: number
  orderCount: number
  ordersById: Map<number, Order>
}

export function createOrderbook(): Orderbook {
  return {
    bids: new RBTree((a, b) => b.price - a.price),
    asks: new RBTree((a, b) => a.price - b.price),
    bestBid: 0,
    bestAsk: 0,
    orderCount: 0,
    ordersById: new Map(),
  }
}

// A mock level because the find API of bintree expects
// a level to find instead of a predicate.
const mockLevel = createLevel(createOrder(0, OrderSide.Bid, 0, 0))

function createOrAddToLevel(levels: RBTree<Level>, order: Order) {
  mockLevel.price = order.price
  const existingLevel = levels.find(mockLevel)

  if (existingLevel) {
    addOrderToLevel(existingLevel, order)
  } else {
    levels.insert(createLevel(order))
  }
}

function match(ob: Orderbook, order: Order) {
  const oppositeLevels = order.side === OrderSide.Bid ? ob.asks : ob.bids

  let result = MatchResult.Continuation
  let it = oppositeLevels.iterator()
  let level: Level | null

  const onRestingFilled = (id: number) => ob.ordersById.delete(id)

  const levelsToRemove: Level[] = []

  while ((level = it.next()) !== null) {
    result = matchOrder(level, order, onRestingFilled)

    if (!level.orders.length) {
      levelsToRemove.push(level)
    }

    // CannotMatch or Complete.
    if (result !== MatchResult.Continuation) {
      break
    }
  }

  // This is an inefficient operation, is it worth it?
  // TODO: perf test without this
  for (const level of levelsToRemove) {
    oppositeLevels.remove(level)
  }
}

export function addOrder(ob: Orderbook, side: OrderSide, price: number, qty: number) {
  const orderId = ob.orderCount++
  const order = createOrder(orderId, side, price, qty)

  // Match the order if possible.
  match(ob, order)

  // Update book & last prices if needed.
  if (side === OrderSide.Bid) {
    if (order.qtyLeft > 0) {
      createOrAddToLevel(ob.bids, order)
      ob.ordersById.set(orderId, order)
    }
  } else {
    if (order.qtyLeft > 0) {
      createOrAddToLevel(ob.asks, order)
      ob.ordersById.set(orderId, order)
    }
  }

  // Update best bid incase it changed.
  ob.bestBid = ob.bids.min()?.price || 0
  // Update best ask incase it changed.
  ob.bestAsk = ob.asks.min()?.price || 0

  return order
}

export function cancelOrder(ob: Orderbook, orderId: number) {
  const order = ob.ordersById.get(orderId)
  if (!order) {
    return false
  }

  order.status = OrderStatus.Cancelled

  // The order still exists for a time in levels
  // and will be removed from there during the
  // matching process.
  ob.ordersById.delete(orderId)

  return true
}
