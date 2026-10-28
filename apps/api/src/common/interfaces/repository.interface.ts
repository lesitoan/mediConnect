export interface IRepository<
  TEntity,
  TCreateInput = Partial<TEntity>,
  TUpdateInput = Partial<TCreateInput>,
> {
  findById(id: string): Promise<TEntity | null>;
  findAll(): Promise<TEntity[]>;
  create(data: TCreateInput): Promise<TEntity>;
  update(id: string, data: TUpdateInput): Promise<TEntity | null>;
  delete(id: string): Promise<TEntity | null>;
}
