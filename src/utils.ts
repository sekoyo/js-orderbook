import Big from 'big.js'

// Numbers coming into the orderbook should have
// already been multiplied up. The OB supports
// fractions to 8 places, i.e. 0.00000001 * 10**8 = 1
// It's up to the UI to divide these numbers down
// into their proper values. This is so that there
// are no fractinal innacuracies in the OB (except
// for order.avgFillPrice), while the cost of conversion
// is spent in programs that can horizontally scale.
export function mul8(n: number) {
  return new Big(n).mul(1e8).toNumber()
}

export function div8(n: number) {
  return new Big(n).div(1e8).toNumber()
}
