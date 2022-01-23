export enum OrderSide {
  Bid,
  Ask,
}

export enum OrderStatus {
  Open,
  PartialFill,
  Filled,
  Cancelled,
}

export enum MatchResult {
  CannotMatch,
  Continuation,
  Complete,
}
