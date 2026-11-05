import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { TransactionResourcesChangedError } from './transaction-resources-changed.error';

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 50;
const logger = new Logger('TransactionRetry');

function isTransactionConflict(
  error: unknown,
  seen = new Set<object>(),
): boolean {
  if (error instanceof TransactionResourcesChangedError) return true;
  if (typeof error !== 'object' || error === null || seen.has(error))
    return false;
  seen.add(error);
  const detail = error as Record<string, unknown>;
  if (
    detail.code === 'P2034' ||
    detail.code === '40001' ||
    detail.code === '40P01' ||
    detail.kind === 'TransactionWriteConflict'
  ) {
    return true;
  }
  return ['cause', 'meta', 'driverAdapterError'].some((key) =>
    isTransactionConflict(detail[key], seen),
  );
}

// Only use for transactions whose callbacks have no external side effects.
// Retrying the entire transaction obtains a new snapshot after a DB rollback.
export async function retryTransaction<T>(
  transaction: () => Promise<T>,
  operation: string,
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await transaction();
    } catch (error) {
      if (!isTransactionConflict(error)) throw error;
      if (attempt >= MAX_ATTEMPTS) {
        logger.error(
          `${operation}: transaction conflict after ${attempt} attempts`,
        );
        throw new ServiceUnavailableException(
          'Database transaction is busy; please try again',
          { cause: error },
        );
      }
      logger.warn(
        `${operation}: retrying transaction after conflict (${attempt})`,
      );
      const delay =
        BASE_DELAY_MS * 2 ** (attempt - 1) +
        Math.floor(Math.random() * BASE_DELAY_MS);
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
    }
  }
}
