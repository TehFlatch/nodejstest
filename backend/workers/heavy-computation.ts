import { parentPort, workerData } from 'worker_threads';

function heavyComputation(limit: number): number {
    let count = 0;
    for (let i = 0; i < limit; i++) {
        // Simulate cpu intensity
        Math.sqrt(i);
        count++;
    }
    return count;
}

const result = heavyComputation(workerData.limit);
if (parentPort) {
    parentPort.postMessage(result);
}
