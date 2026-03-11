import { Queue } from 'bullmq';
export declare const queues: {
    github: Queue<any, any, string, any, any, string>;
    arxiv: Queue<any, any, string, any, any, string>;
    news: Queue<any, any, string, any, any, string>;
    tools: Queue<any, any, string, any, any, string>;
    trending: Queue<any, any, string, any, any, string>;
    summarizer: Queue<any, any, string, any, any, string>;
};
export declare function initQueues(): Promise<void>;
export declare function getQueueStats(): Promise<Record<string, unknown>>;
//# sourceMappingURL=queue.d.ts.map