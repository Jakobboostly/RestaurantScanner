import { restaurants, scans, type Restaurant, type InsertRestaurant, type Scan, type InsertScan } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Restaurant methods
  getRestaurant(placeId: string): Promise<Restaurant | undefined>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  
  // Scan methods
  getScan(id: number): Promise<Scan | undefined>;
  getLatestScanForRestaurant(placeId: string): Promise<Scan | undefined>;
  createScan(scan: InsertScan): Promise<Scan>;
  getScansByDomain(domain: string): Promise<Scan[]>;
  getScansByPlaceId(placeId: string): Promise<Scan[]>;
}

export class MemStorage implements IStorage {
  private restaurants: Map<string, Restaurant>;
  private scans: Map<number, Scan>;
  private scanIdCounter: number;

  constructor() {
    this.restaurants = new Map();
    this.scans = new Map();
    this.scanIdCounter = 1;
  }

  async getRestaurant(placeId: string): Promise<Restaurant | undefined> {
    return this.restaurants.get(placeId);
  }

  async createRestaurant(insertRestaurant: InsertRestaurant): Promise<Restaurant> {
    const restaurant: Restaurant = {
      ...insertRestaurant,
      domain: insertRestaurant.domain ?? null,
      rating: insertRestaurant.rating ?? null,
      totalRatings: insertRestaurant.totalRatings ?? null,
      priceLevel: insertRestaurant.priceLevel ?? null,
      createdAt: new Date(),
    };
    this.restaurants.set(restaurant.placeId, restaurant);
    return restaurant;
  }

  async getScan(id: number): Promise<Scan | undefined> {
    return this.scans.get(id);
  }

  async getLatestScanForRestaurant(placeId: string): Promise<Scan | undefined> {
    const restaurantScans = Array.from(this.scans.values()).filter(
      (scan) => scan.placeId === placeId
    );
    return restaurantScans.sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    )[0];
  }

  async createScan(insertScan: InsertScan): Promise<Scan> {
    const id = this.scanIdCounter++;
    const scan: Scan = {
      ...insertScan,
      id,
      competitorData: insertScan.competitorData ?? null,
      createdAt: new Date(),
    };
    this.scans.set(id, scan);
    return scan;
  }

  async getScansByDomain(domain: string): Promise<Scan[]> {
    return Array.from(this.scans.values()).filter(
      (scan) => scan.domain === domain
    );
  }

  async getScansByPlaceId(placeId: string): Promise<Scan[]> {
    return Array.from(this.scans.values()).filter(
      (scan) => scan.placeId === placeId
    );
  }
}

export class DbStorage implements IStorage {
  async getRestaurant(placeId: string): Promise<Restaurant | undefined> {
    const result = await db.select().from(restaurants).where(eq(restaurants.placeId, placeId)).limit(1);
    return result[0];
  }

  async createRestaurant(insertRestaurant: InsertRestaurant): Promise<Restaurant> {
    const result = await db.insert(restaurants).values(insertRestaurant).returning();
    return result[0];
  }

  async getScan(id: number): Promise<Scan | undefined> {
    const result = await db.select().from(scans).where(eq(scans.id, id)).limit(1);
    return result[0];
  }

  async getLatestScanForRestaurant(placeId: string): Promise<Scan | undefined> {
    const result = await db.select()
      .from(scans)
      .where(eq(scans.placeId, placeId))
      .orderBy(desc(scans.createdAt))
      .limit(1);
    return result[0];
  }

  async createScan(insertScan: InsertScan): Promise<Scan> {
    const result = await db.insert(scans).values(insertScan).returning();
    return result[0];
  }

  async getScansByDomain(domain: string): Promise<Scan[]> {
    return await db.select().from(scans).where(eq(scans.domain, domain));
  }

  async getScansByPlaceId(placeId: string): Promise<Scan[]> {
    return await db.select().from(scans).where(eq(scans.placeId, placeId));
  }
}

// Use database storage if available, otherwise fall back to memory storage
export const storage = db ? new DbStorage() : new MemStorage();
