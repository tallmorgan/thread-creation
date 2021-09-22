export class ThreadCreationRow {
  constructor(
    public id: number,
    public masterThreadId: number | null,
    public dealPublicId: string,
    public createdAt: Date,
    public updatedAt: Date,
  ) {
  }
}
