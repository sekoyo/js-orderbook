# JS Orderbook

This is an implementation of an orderbook in JS (Typescript). It's implemented as follows:

- Prices and quantities are multiplied by 1e+8 such that the lowest supported value for either is `0.0000001` which is the equivalent to `1` in the orderbook. This is to avoid floating point arithmetic inaccuracies.

- Validation of orders and multiplication out/into doubles should be done outside the orderbook.

The orderbook is structured as:

```ts
interface Orderbook {
  bids: RBTree<Level>
  asks: RBTree<Level>
  bestBid: number
  bestAsk: number
  orderCount: number
  ordersById: Map<number, Order>
}
```

RBTree = red-black binary tree

It would be interesting to experiment with a fixed contiguous array for price levels (though the underlying representation of an array in JS might be a map).

Levels are implemented as:

```ts
interface Level {
  orders: Order[]
  side: OrderSide
  price: number
  totalQty: number
}
```

We treat `Order` arrays the same way we would deques in the hopes that the JS engine will more optimally perform by only modifying the head and tail of the array.

## Todo

- Set up integration tests & benchmarks.
- On OB creation:
  symbol, baseCcy, quoteCcy, baseScale(1_000_000), quoteScale(10_000), takerFee, makerFee.
- OB Events.
- Order types: Immediate-or-Cancel (IOC), Good-till-Cancel (GTC), Fill-or-Kill Budget (FOK-B)
- Market orders.
- `amendOrder` (qty only). Could support price+qty for an atomic update but this should be a remove+add internally for fairness.
- Load OB data snapshot.
- Allow settings changes on the fly.
