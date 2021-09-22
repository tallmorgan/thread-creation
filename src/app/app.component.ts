import { Component } from '@angular/core';

import { PendingMessage } from '../common/model/pending-message.model';
import { AppService } from './app.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [AppService],
})
export class AppComponent {
  title = 'thread-creation';

  dealId = 'foo';

  stringify = item => JSON.stringify(item, null, 2);

  constructor(
    public service: AppService,
  ) {
  }

  createMessage(dealPublicId: string) {
    // can we use an existing thread?
    const thread = this.service.masterThreadTable.find(row => row.dealPublicId === dealPublicId);
    if (thread) {
      this.service.queueMessage(dealPublicId, thread.id);
    }
    // check thread_creation table
    else {
      const message = this.service.queueMessage(dealPublicId);
      // can we use an existing thread_creation row?
      if (this.service.threadCreationTable.find(row => row.dealPublicId === dealPublicId)) {
        this.service.insertBarcodeThreadMapRow(dealPublicId, message.barcode);
      }
      // create a thread_creation row
      else {
        this.service.insertThreadCreationRow(dealPublicId);
        this.service.insertBarcodeThreadMapRow(dealPublicId, message.barcode);
      }
    }
  }

  resolveMessage(message: PendingMessage) {
    this.service.receiveMessage(message);
    // was the message created when a thread already existed?
    if (message.threadId) {
      this.service.insertMessage(message.threadId, message);
    }
    // check thread_creation table
    else if (this.service.barcodeThreadMapTable.find(row => row.barcode === message.barcode)) {
      const barcodeRow = this.service.barcodeThreadMapTable.find(row => row.barcode === message.barcode)!;
      const threadCreationRow = this.service.threadCreationTable.find(row => row.id === barcodeRow.threadCreationId)!;
      // do we need to create a thread via thread_creation?
      if (!threadCreationRow.masterThreadId) {
        const masterThreadRow = this.service.insertMasterThreadRow(message);
        this.service.insertMessage(masterThreadRow.id, message);
        this.service.updateThreadCreationTable(threadCreationRow.id);
        this.service.deleteBarcodeThreadMapRow(message.barcode);
      }
      // was a thread created while this message was queued?
      else {
        this.service.insertMessage(threadCreationRow.masterThreadId, message);
        this.service.deleteBarcodeThreadMapRow(message.barcode);
      }
    }
    // clean up old thread_creation rows
    this.service.deleteEmptyThreadCreationRows();
  }
}
