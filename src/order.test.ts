import { expect } from 'chai'

import { mul8 } from './utils'
import { createOrder, fillOrder } from './order'
import { OrderSide, OrderStatus } from './types'

describe('Order', () => {
  it('can fill an order', () => {
    // Order 1000 lots for $2 per unit.
    const order = createOrder(1, OrderSide.Bid, mul8(2), 1000)

    // Side should be bid with an open status.
    expect(order.side).to.eq(OrderSide.Bid)
    expect(order.status).to.eq(OrderStatus.Open)

    // Fill 500 lots at $1.9 per unit.
    fillOrder(order, 500, mul8(1.9))

    expect(order.qtyLeft).to.eq(500, 'Should have 500 units left.')

    expect(order.avgFillPrice).to.eq(mul8(1.9), 'Average fill price should be $1.9')

    expect(order.status).to.eq(OrderStatus.PartialFill, 'Status should be PartialFill.')

    // Fill up the order. NOTE that we cannot overfill
    // the order otherwise it will break the u64 type
    // on quantity_left. Since Level ensures we don't
    // overfill this is OK and more efficient.
    fillOrder(order, 500, mul8(2))

    expect(order.qtyLeft).to.eq(0, 'quantity_left should be 0')

    expect(order.status).to.eq(OrderStatus.Filled, 'Status should be Filled')
  })
})
