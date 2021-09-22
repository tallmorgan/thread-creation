export class PendingMessage {
  constructor(
    public id: number,
    public dealPublicId: string,
    public threadId: number | null,
    public barcode: string,
    public message: string,
  ) {
  }
}
