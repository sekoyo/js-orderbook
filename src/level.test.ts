import { expect } from 'chai'

import { mul8 } from './utils'
import { OrderSide } from './types'
import { createOrder } from './order'
import { addOrderToLevel, canMatch, createLevel, matchOrder } from './level'

describe('Level', () => {
  it('can match orders', () => {
    // Create new bid level at $2.
    const restingBidOrder1 = createOrder(1, OrderSide.Bid, mul8(2), 1000)
    const restingBidOrder2 = createOrder(2, OrderSide.Bid, mul8(2), 1000)
    const bidLevel = createLevel(restingBidOrder1)
    addOrderToLevel(bidLevel, restingBidOrder2)

    // Create new ask level at $2.2.
    const restingAskOrder1 = createOrder(3, OrderSide.Ask, mul8(2.2), 1000)
    const restingAskOrder2 = createOrder(4, OrderSide.Ask, mul8(2.2), 1000)
    const askLevel = createLevel(restingAskOrder1)
    addOrderToLevel(askLevel, restingAskOrder2)

    // It's not matchable if the ask is > the bid
    // price ($2).
    expect(canMatch(bidLevel, createOrder(1, OrderSide.Ask, mul8(2.01), 1))).to.eq(false)

    // It's not matchable if the bid is < the
    // ask price ($2.2).
    expect(canMatch(askLevel, createOrder(1, OrderSide.Bid, mul8(2.19), 1))).to.eq(false)

    // It's matchable if the ask is <= the bid
    // price ($2).
    expect(canMatch(bidLevel, createOrder(1, OrderSide.Ask, mul8(2), 1))).to.eq(true)

    // It's matchable if the bid is >= the ask
    // price ($2.2).
    expect(canMatch(askLevel, createOrder(1, OrderSide.Bid, mul8(2.2), 1))).to.eq(true)

    // Ensure that the order of orders is respected
    // (oldest first as it has priority).
    expect(bidLevel.orders[0].orderId).to.eq(restingBidOrder1.orderId)
    expect(bidLevel.orders[1].orderId).to.eq(restingBidOrder2.orderId)
    expect(askLevel.orders[0].orderId).to.eq(restingAskOrder1.orderId)
    expect(askLevel.orders[1].orderId).to.eq(restingAskOrder2.orderId)

    // Match a bid against the ask $2.2 level.
    matchOrder(askLevel, createOrder(1, OrderSide.Bid, mul8(2.3), 500), () => {})

    // Ask level should have filled 500 from the first
    // ask and have 500 left.
    expect(askLevel.orders[0].qtyFilled).to.eq(500)
    expect(askLevel.orders[0].qtyLeft).to.eq(500)

    // Fill remaining and some of the 2nd ask order.
    matchOrder(askLevel, createOrder(1, OrderSide.Bid, mul8(2.2), 700), () => {})
    expect(askLevel.orders.length).to.eq(1)
    expect(askLevel.orders[0].qtyFilled).to.eq(200)
    expect(askLevel.orders[0].qtyLeft).to.eq(800)
  })
})
