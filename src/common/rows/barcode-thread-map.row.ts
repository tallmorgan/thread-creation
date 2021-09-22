export class BarcodeThreadMapRow {
  constructor(
    public id: number,
    public threadCreationId: number,
    public userPublicId: string,
    public barcode: string,
    public createdAt: Date,
    public updatedAt: Date,
  ) {
  }
}
