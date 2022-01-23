import { OrderSide, OrderStatus } from './types'

export interface Order {
  orderId: number
  side: OrderSide
  price: number
  qty: number
  qtyLeft: number
  qtyFilled: number
  status: OrderStatus
  totalCost: number
  avgFillPrice: number
  timestamp: number
}

export function createOrder(orderId: number, side: OrderSide, price: number, qty: number): Order {
  return {
    orderId,
    side,
    price,
    qty,
    qtyLeft: qty,
    qtyFilled: 0,
    status: OrderStatus.Open,
    totalCost: 0,
    avgFillPrice: 0,
    timestamp: Date.now(),
  }
}

export function fillOrder(order: Order, qty: number, price: number) {
  order.totalCost += qty * price
  order.qtyLeft -= qty
  order.qtyFilled += qty
  order.avgFillPrice = order.totalCost / order.qtyFilled

  if (order.qtyLeft === 0) {
    order.status = OrderStatus.Filled
  } else {
    order.status = OrderStatus.PartialFill
  }

  return order.status
}
