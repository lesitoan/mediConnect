import { OrderByEnum } from '../enums/order-by.enum';

export class OrderBySearchDto {
  convertOrderByToORM<T extends string>(
    filter: Partial<Record<T, OrderByEnum>>,
  ): Partial<Record<T, 'asc' | 'desc'>>[] {
    const orderBy: Partial<Record<T, 'asc' | 'desc'>>[] = [];
    for (const key of Object.keys(filter) as T[]) {
      const direction = filter[key];
      if (direction === undefined) continue;
      if (direction !== OrderByEnum.ASC && direction !== OrderByEnum.DESC) {
        throw new RangeError('Invalid sort direction');
      }
      orderBy.push({
        [key]: direction === OrderByEnum.ASC ? 'asc' : 'desc',
      } as Partial<Record<T, 'asc' | 'desc'>>);
    }
    return orderBy;
  }
}
