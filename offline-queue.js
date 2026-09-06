/**
 * TANTRADE OFFLINE QUEUE MANAGER
 * Handles offline storage and prevents duplicate submissions.
 */
class TanTradeOfflineQueue {
  constructor(storageKey = 'tantrade_offline_queue_v1') {
    this.storageKey = storageKey;
  }

  // Get all pending submissions
  getQueue() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    } catch (e) {
      return [];
    }
  }

  // Add a submission to the queue (Prevents exact duplicates)
  addToQueue(formData) {
    const queue = this.getQueue();
    
    // Generate a unique ID for this specific submission
    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    
    const queueItem = {
      id: uniqueId,
      data: formData,
      timestamp: new Date().toISOString(),
      formId: formData.form_id || 'unknown' // Helps route to correct Supabase table
    };

    // PREVENT DUPLICATES: Check if this exact data payload already exists
    const isDuplicate = queue.some(item => 
      JSON.stringify(item.data) === JSON.stringify(formData)
    );

    if (!isDuplicate) {
      queue.push(queueItem);
      localStorage.setItem(this.storageKey, JSON.stringify(queue));
      console.log(`[OfflineQueue] Saved submission ${uniqueId} to offline queue.`);
      return true;
    } else {
      console.warn(`[OfflineQueue] Duplicate submission blocked.`);
      return false;
    }
  }

  // Sync queue with Supabase when online
  async syncQueue(supabaseClient) {
    const queue = this.getQueue();
    if (queue.length === 0) return { success: 0, failed: 0 };

    let successCount = 0;
    let failedCount = 0;
    const idsToRemove = [];

    console.log(`[OfflineQueue] Syncing ${queue.length} pending submissions...`);

    for (const item of queue) {
      try {
        const tableName = item.formId || 'wadau_malighafi_responses';
        
        // Send to Supabase
        const { error } = await supabaseClient
          .from(tableName)
          .insert(item.data);

        if (error) throw error;

        // ONLY mark for removal if Supabase says it was successful
        idsToRemove.push(item.id);
        successCount++;
        
      } catch (error) {
        console.error(`[OfflineQueue] Failed to sync item ${item.id}:`, error);
        failedCount++;
      }
    }

    // Remove successfully sent items from localStorage
    if (idsToRemove.length > 0) {
      const newQueue = queue.filter(item => !idsToRemove.includes(item.id));
      localStorage.setItem(this.storageKey, JSON.stringify(newQueue));
      console.log(`[OfflineQueue] Sync complete. Removed ${idsToRemove.length} items.`);
    }

    return { success: successCount, failed: failedCount };
  }

  // Get count of pending items (for UI badges)
  getPendingCount() {
    return this.getQueue().length;
  }
}

// Initialize globally so both script.js and admin.js can use it
window.tantradeQueue = new TanTradeOfflineQueue();
