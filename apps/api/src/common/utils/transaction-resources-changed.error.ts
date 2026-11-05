export class TransactionResourcesChangedError extends Error {
  constructor() {
    super('Transaction resources changed while acquiring locks');
  }
}
