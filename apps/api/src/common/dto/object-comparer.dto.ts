export class ObjectComparerDto<T extends object> {
  constructor(private readonly objectData: T) {}

  getUpdatedFields(newObjectData: Partial<T>): Partial<T> {
    return Object.fromEntries(
      Object.entries(newObjectData).filter(
        ([key, value]) => !Object.is(value, this.objectData[key as keyof T]),
      ),
    ) as Partial<T>;
  }
}
