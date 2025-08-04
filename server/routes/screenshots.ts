import { Router } from 'express';
import { db } from '../db';
import { screenshots } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

const router = Router();

// Get all screenshots
router.get('/', async (req, res) => {
  try {
    const results = await db
      .select({
        id: screenshots.id,
        keyword: screenshots.keyword,
        location: screenshots.location,
        restaurantName: screenshots.restaurantName,
        searchUrl: screenshots.searchUrl,
        fileSize: screenshots.fileSize,
        captureDate: screenshots.captureDate
      })
      .from(screenshots)
      .orderBy(desc(screenshots.captureDate));
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching screenshots:', error);
    res.status(500).json({ error: 'Failed to fetch screenshots' });
  }
});

// Get screenshot image by ID
router.get('/:id/image', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [result] = await db
      .select({
        imageData: screenshots.imageData,
        keyword: screenshots.keyword
      })
      .from(screenshots)
      .where(eq(screenshots.id, id));
    
    if (!result) {
      return res.status(404).json({ error: 'Screenshot not found' });
    }
    
    // Convert base64 to buffer and send as PNG
    const imageBuffer = Buffer.from(result.imageData, 'base64');
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': imageBuffer.length.toString(),
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    });
    res.send(imageBuffer);
  } catch (error) {
    console.error('Error fetching screenshot image:', error);
    res.status(500).json({ error: 'Failed to fetch screenshot image' });
  }
});

export default router;