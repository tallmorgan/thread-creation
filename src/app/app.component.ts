import { Component } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

import { ThreadCreationRow } from '../common/rows/thread-creation.row';
import { BarcodeThreadMapRow } from '../common/rows/barcode-thread-map.row';
import { MasterThreadRow } from '../common/rows/master-thread.row';
import { PendingMessage } from '../common/model/pending-message.model';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'thread-creation';

  ids = {
    message: 0, // auto-increment
    barcodeThreadMap: 0, // auto-increment
    threadCreation: 0, // auto-increment
    thread: 0, // auto-increment
    deal: 'foo', // manual public id
  };

  threadCreationTable: ThreadCreationRow[] = [];

  barcodeThreadMapTable: BarcodeThreadMapRow[] = [];

  masterThreadTable: MasterThreadRow[] = [];

  pendingMessages: PendingMessage[] = [];

  stringify = item => JSON.stringify(item, null, 2);

  createMessage(dealPublicId: string) {
    // can we use an existing thread?
    const thread = this.masterThreadTable.find(row => row.dealPublicId === dealPublicId);
    if (thread) {
      this.queueMessage(dealPublicId, thread.id);
    }
    // can we use an existing thread_creation row?
    else if (this.threadCreationTable.find(row => row.dealPublicId === dealPublicId)) {
      const barcode = this.queueMessage(dealPublicId);
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
    // create a thread_creation row
    else {
      this.threadCreationTable = this.threadCreationTable.concat(
        new ThreadCreationRow(
          ++this.ids.threadCreation,
          null,
          dealPublicId,
          new Date,
          new Date,
        ),
      );
      const barcode = this.queueMessage(dealPublicId);
      this.barcodeThreadMapTable = this.barcodeThreadMapTable.concat(
        new BarcodeThreadMapRow(
          ++this.ids.barcodeThreadMap,
          this.ids.threadCreation,
          'user-public-id',
          barcode,
          new Date,
          new Date,
        ),
      );
    }
  }

  resolveMessage(message: PendingMessage) {
    // receive push
    this.pendingMessages = this.pendingMessages.filter(row => {
      return row !== message;
    });
    // was the message created when a thread already existed?
    if (message.threadId) {
      this.insertMessage(message.threadId, message);
    }
    // check thread_creation table
    else if (this.barcodeThreadMapTable.find(row => row.barcode === message.barcode)) {
      const barcodeRow = this.barcodeThreadMapTable.find(row => row.barcode === message.barcode)!;
      const threadCreationRow = this.threadCreationTable.find(row => row.id === barcodeRow.threadCreationId)!;
      // do we need to create a thread via thread_creation?
      if (!threadCreationRow.masterThreadId) {
        this.masterThreadTable = this.masterThreadTable.concat(
          new MasterThreadRow(
            ++this.ids.thread,
            message.dealPublicId,
            [],
          ),
        );
        this.insertMessage(this.ids.thread, message);
        this.threadCreationTable = this.threadCreationTable.map(row => {
          if (row === threadCreationRow) {
            row.masterThreadId = this.ids.thread;
          }
          return row;
        });
        this.barcodeThreadMapTable = this.barcodeThreadMapTable.filter(row => {
          return row.barcode !== message.barcode;
        });
      }
      // was a thread created while this message was queued?
      else {
        this.insertMessage(threadCreationRow.masterThreadId, message);
        this.barcodeThreadMapTable = this.barcodeThreadMapTable.filter(row => {
          return row.barcode !== message.barcode;
        });
      }
    }
    // clean up old thread_creation rows
    this.threadCreationTable = this.threadCreationTable.filter(row => {
      return this.barcodeThreadMapTable.filter(join => join.threadCreationId === row.id).length > 0;
    });
  }

  private queueMessage(dealPublicId: string, threadId: number | null = null) {
    this.pendingMessages = this.pendingMessages.concat(new PendingMessage(
      ++this.ids.message,
      dealPublicId,
      threadId,
      uuidv4(),
      `lorem ipsum ${this.ids.message}`,
    ));
    return this.pendingMessages[this.pendingMessages.length - 1].barcode;
  }

  private insertMessage(threadId: number, message: PendingMessage) {
    this.masterThreadTable = this.masterThreadTable.map(row => {
      if (row.id === threadId) {
        row.digest = [`lorem ipsum ${message.id}`].concat(row.digest);
      }
      return row;
    });
  }
}
