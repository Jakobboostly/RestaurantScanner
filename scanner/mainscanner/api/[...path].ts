import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { routes } from '../server/routes.js';

const app = express();

// Add middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Enable CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Mount routes
app.use('/api', routes);

// Export as serverless function
export default async (req: VercelRequest, res: VercelResponse) => {
  return new Promise((resolve) => {
    app(req as any, res as any, (result) => {
      if (result instanceof Error) {
        return resolve(result);
      }
      return resolve(result);
    });
  });
};