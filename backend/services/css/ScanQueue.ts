/**
 * CSS Scan Queue
 * ===============
 * Async scan queue for the Code Security System.
 * Manages concurrent scan execution with backpressure.
 */

import { CSSService, ScanRequest, ScanResult } from "./CSSService";

// --- Types ---

interface QueuedScan {
    id: string;
    request: ScanRequest;
    resolve: (result: ScanResult) => void;
    reject: (error: Error) => void;
    queuedAt: Date;
}

// --- Queue ---

export class ScanQueue {
    private queue: QueuedScan[] = [];
    private processing = 0;
    private maxConcurrent: number;

    constructor(maxConcurrent = 5) {
        this.maxConcurrent = maxConcurrent;
    }

    /**
     * Enqueue a scan request. Returns a promise that resolves when the scan completes.
     */
    async enqueue(request: ScanRequest): Promise<ScanResult> {
        return new Promise<ScanResult>((resolve, reject) => {
            const id = `queue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            this.queue.push({ id, request, resolve, reject, queuedAt: new Date() });
            console.log(
                `📋 [ScanQueue] Enqueued scan ${id} — queue depth: ${this.queue.length}, ` +
                `processing: ${this.processing}`
            );
            this.processNext();
        });
    }

    /**
     * Process next item in queue if capacity allows.
     */
    private async processNext(): Promise<void> {
        if (this.processing >= this.maxConcurrent || this.queue.length === 0) {
            return;
        }

        const item = this.queue.shift()!;
        this.processing++;

        console.log(
            `⚙️ [ScanQueue] Processing scan ${item.id} — ` +
            `waited ${Date.now() - item.queuedAt.getTime()}ms`
        );

        try {
            const result = await CSSService.scan(item.request);
            item.resolve(result);
        } catch (error: any) {
            item.reject(error);
        } finally {
            this.processing--;
            this.processNext(); // Process next in queue
        }
    }

    /**
     * Get queue status.
     */
    getStatus() {
        return {
            queued: this.queue.length,
            processing: this.processing,
            maxConcurrent: this.maxConcurrent,
        };
    }
}

// Singleton
export const scanQueue = new ScanQueue();





