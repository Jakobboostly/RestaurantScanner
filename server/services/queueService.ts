import Queue from 'bull';
import Redis from 'redis';
import { ScanResult } from '../../shared/schema';

export interface ScanJobData {
  placeId: string;
  domain: string;
  restaurantName: string;
  latitude: number;
  longitude: number;
  userId?: string;
}

export interface JobProgress {
  progress: number;
  status: string;
  timestamp: Date;
}

export class QueueService {
  private scanQueue: Queue.Queue<ScanJobData>;
  private redisClient: Redis.RedisClientType;
  private isInitialized = false;

  constructor() {
    // Initialize Redis client
    this.redisClient = Redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    // Initialize Bull queue
    this.scanQueue = new Queue('restaurant-scan', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      },
      defaultJobOptions: {
        removeOnComplete: 50, // Keep last 50 completed jobs
        removeOnFail: 20, // Keep last 20 failed jobs
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.redisClient.connect();
      console.log('Redis connected');
      
      this.isInitialized = true;
      console.log('Queue service initialized');
    } catch (error) {
      console.error('Failed to initialize queue service:', error);
      throw error;
    }
  }

  async addScanJob(data: ScanJobData): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const job = await this.scanQueue.add('scan-restaurant', data, {
      priority: 1,
      delay: 0
    });

    return job.id?.toString() || '';
  }

  async getJobStatus(jobId: string): Promise<{
    status: string;
    progress: number;
    result?: ScanResult;
    error?: string;
  }> {
    const job = await this.scanQueue.getJob(jobId);
    
    if (!job) {
      return { status: 'not_found', progress: 0 };
    }

    const state = await job.getState();
    const progress = job.progress();

    return {
      status: state,
      progress: typeof progress === 'number' ? progress : 0,
      result: job.returnvalue,
      error: job.failedReason
    };
  }

  async updateJobProgress(jobId: string, progress: number, status: string): Promise<void> {
    const job = await this.scanQueue.getJob(jobId);
    if (job) {
      await job.progress(progress);
      await this.setJobStatus(jobId, status);
    }
  }

  private async setJobStatus(jobId: string, status: string): Promise<void> {
    const key = `job:${jobId}:status`;
    await this.redisClient.setEx(key, 3600, status); // Expire after 1 hour
  }

  async getJobProgress(jobId: string): Promise<JobProgress | null> {
    const key = `job:${jobId}:status`;
    const status = await this.redisClient.get(key);
    
    if (!status) return null;

    const job = await this.scanQueue.getJob(jobId);
    const progress = job ? (typeof job.progress() === 'number' ? job.progress() : 0) : 0;

    return {
      progress,
      status,
      timestamp: new Date()
    };
  }

  getQueue(): Queue.Queue<ScanJobData> {
    return this.scanQueue;
  }

  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    const waiting = await this.scanQueue.getWaiting();
    const active = await this.scanQueue.getActive();
    const completed = await this.scanQueue.getCompleted();
    const failed = await this.scanQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length
    };
  }

  async close(): Promise<void> {
    if (this.scanQueue) {
      await this.scanQueue.close();
    }
    if (this.redisClient) {
      await this.redisClient.quit();
    }
    this.isInitialized = false;
    console.log('Queue service closed');
  }
}

// Singleton instance
export const queueService = new QueueService();