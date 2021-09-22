import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

import { PendingMessage } from '../common/model/pending-message.model';
import { MasterThreadRow } from '../common/rows/master-thread.row';
import { BarcodeThreadMapRow } from '../common/rows/barcode-thread-map.row';
import { ThreadCreationRow } from '../common/rows/thread-creation.row';


@Injectable()
export class AppService {
  threadCreationTable: ThreadCreationRow[] = [];

  barcodeThreadMapTable: BarcodeThreadMapRow[] = [];

  masterThreadTable: MasterThreadRow[] = [];

  pendingMessages: PendingMessage[] = [];

  ids = {
    message: 0,
    barcodeThreadMap: 0,
    threadCreation: 0,
    thread: 0,
  };

  deleteEmptyThreadCreationRows() {
    this.threadCreationTable = this.threadCreationTable.filter(row => {
      return this.barcodeThreadMapTable.filter(join => join.threadCreationId === row.id).length > 0;
    });
  }

  deleteBarcodeThreadMapRow(barcode: string) {
    this.barcodeThreadMapTable = this.barcodeThreadMapTable.filter(row => {
      return row.barcode !== barcode;
    });
  }

  insertMasterThreadRow(message: PendingMessage) {
    this.masterThreadTable = this.masterThreadTable.concat(
      new MasterThreadRow(
        ++this.ids.thread,
        message.dealPublicId,
        [],
      ),
    );
    return this.masterThreadTable[this.masterThreadTable.length - 1];
  }

  updateThreadCreationTable(threadCreationId: number) {
    this.threadCreationTable = this.threadCreationTable.map(row => {
      if (row.id === threadCreationId) {
        row.masterThreadId = this.ids.thread;
      }
      return row;
    });
  }

  insertBarcodeThreadMapRow(dealPublicId: string, barcode: string) {
    this.barcodeThreadMapTable = this.barcodeThreadMapTable.concat(
      new BarcodeThreadMapRow(
        ++this.ids.barcodeThreadMap,
        this.threadCreationTable.find(row => row.dealPublicId === dealPublicId)!.id,
        'user-public-id',
        barcode,
        new Date,
        new Date,
      ),
    );
  }

  queueMessage(dealPublicId: string, threadId: number | null = null) {
    this.pendingMessages = this.pendingMessages.concat(new PendingMessage(
      ++this.ids.message,
      dealPublicId,
      threadId,
      uuidv4(),
      `lorem ipsum ${this.ids.message}`,
    ));
    return this.pendingMessages[this.pendingMessages.length - 1];
  }

  insertThreadCreationRow(dealPublicId: string) {
    this.threadCreationTable = this.threadCreationTable.concat(
      new ThreadCreationRow(
        ++this.ids.threadCreation,
        null,
        dealPublicId,
        new Date,
        new Date,
      ),
    );
    return this.threadCreationTable[this.threadCreationTable.length - 1];
  }

  insertMessage(threadId: number, message: PendingMessage) {
    this.masterThreadTable = this.masterThreadTable.map(row => {
      if (row.id === threadId) {
        row.digest = [`lorem ipsum ${message.id}`].concat(row.digest);
      }
      return row;
    });
    return this.masterThreadTable.find(row => row.id === threadId);
  }
}
