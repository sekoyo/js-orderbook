import { expect } from 'chai'

import { mul8 } from './utils'
import { OrderSide, OrderStatus } from './types'
import { addOrder, cancelOrder, createOrderbook } from './orderbook'

describe('Orderbook', () => {
  it('can add a first resting bid', () => {
    const ob = createOrderbook()

    const bidOrder = addOrder(ob, OrderSide.Bid, mul8(4), mul8(10))

    expect(ob.bids.size).to.eq(1)
    expect(ob.bestBid).to.eq(bidOrder.price)

    expect(bidOrder.status).to.eq(OrderStatus.Open)
    expect(bidOrder.qty).to.eq(bidOrder.qty)
    expect(bidOrder.qtyLeft).to.eq(bidOrder.qty)
    expect(bidOrder.qtyFilled).to.eq(0)
    expect(bidOrder.totalCost).to.eq(0)
    expect(bidOrder.avgFillPrice).to.eq(0)
  })

  it('can add an ask that gets entirely filled', () => {
    const ob = createOrderbook()

    const bidOrder = addOrder(ob, OrderSide.Bid, mul8(4), mul8(10))
    const askOrder = addOrder(ob, OrderSide.Ask, mul8(3), mul8(1))

    expect(ob.bids.size).to.eq(1)
    expect(ob.bestAsk).to.eq(0) // fully matched so there is none.
    expect(ob.asks.size).to.eq(0) // fully matched.

    expect(askOrder.status).to.eq(OrderStatus.Filled)
    expect(askOrder.qty).to.eq(askOrder.qty)
    expect(askOrder.qtyLeft).to.eq(0)
    expect(askOrder.qtyFilled).to.eq(askOrder.qty)
    expect(askOrder.totalCost).to.eq(bidOrder.price * askOrder.qty)
    expect(askOrder.avgFillPrice).to.eq(bidOrder.price)
  })

  it('min RB tree is the best bid and ask', () => {
    const ob = createOrderbook()
    const bidOrder1 = addOrder(ob, OrderSide.Bid, mul8(3), mul8(1))
    const bidOrder2 = addOrder(ob, OrderSide.Bid, mul8(4), mul8(1))
    const askOrder1 = addOrder(ob, OrderSide.Ask, mul8(5), mul8(1))
    const askOrder2 = addOrder(ob, OrderSide.Ask, mul8(6), mul8(1))

    // Min (best) bid is $4.
    expect(ob.bids.min()?.price).to.eq(bidOrder2.price)
    expect(ob.bids.max()?.price).to.eq(bidOrder1.price)

    expect(ob.bestBid).to.eq(bidOrder2.price)

    // Min (best) ask is $5.
    expect(ob.asks.min()?.price).to.eq(askOrder1.price)
    expect(ob.asks.max()?.price).to.eq(askOrder2.price)

    expect(ob.bestAsk).to.eq(askOrder1.price)
  })

  it('can cascade through orders and then rest', () => {
    const ob = createOrderbook()

    // 3 asks at $5
    const askOrder1 = addOrder(ob, OrderSide.Ask, mul8(5), mul8(4))
    const askOrder2 = addOrder(ob, OrderSide.Ask, mul8(5), mul8(1))
    const askOrder3 = addOrder(ob, OrderSide.Ask, mul8(5), mul8(2.5))

    // 1 ask at $7.3
    const askOrder4 = addOrder(ob, OrderSide.Ask, mul8(7.3), mul8(0.2))

    // 1 ask at $10.1 the bid doesn't reach
    const askOrder5 = addOrder(ob, OrderSide.Ask, mul8(10.1), mul8(0.5))

    // 1 big whale bid for $8
    const bidOrder1 = addOrder(ob, OrderSide.Bid, mul8(8), mul8(10))

    // We expect there to be 2 asks starting at $10.1 (best ask).
    expect(ob.bestBid).to.eq(bidOrder1.price)
    expect(ob.bestAsk).to.eq(askOrder5.price)
    expect(ob.asks.size).to.eq(1)
    expect(ob.bids.size).to.eq(1)

    // The other asks should be filled.
    expect(askOrder1.status).to.eq(OrderStatus.Filled)
    expect(askOrder2.status).to.eq(OrderStatus.Filled)
    expect(askOrder3.status).to.eq(OrderStatus.Filled)
    expect(askOrder4.status).to.eq(OrderStatus.Filled)
    expect(askOrder5.status).to.eq(OrderStatus.Open)

    // Bid should have $2.3 left and an avgFillPrice of $5.06.
    expect(bidOrder1.qtyLeft).to.eq(mul8(2.3))
    expect(bidOrder1.avgFillPrice).to.eq(
      (askOrder1.price * askOrder1.qty +
        askOrder2.price * askOrder2.qty +
        askOrder3.price * askOrder3.qty +
        askOrder4.price * askOrder4.qty) /
        (askOrder1.qty + askOrder2.qty + askOrder3.qty + askOrder4.qty)
    )
  })

  it('can cancel an order', () => {
    const ob = createOrderbook()

    const bidOrder1 = addOrder(ob, OrderSide.Bid, mul8(20), mul8(0.5))

    const result = cancelOrder(ob, bidOrder1.orderId)

    expect(result).to.eq(true)
    expect(bidOrder1.status).to.eq(OrderStatus.Cancelled)
  })
})
