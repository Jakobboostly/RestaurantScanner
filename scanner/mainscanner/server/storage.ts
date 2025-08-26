import { restaurants, scans, type Restaurant, type InsertRestaurant, type Scan, type InsertScan } from "@shared/schema";

export interface IStorage {
  // Restaurant methods
  getRestaurant(id: number): Promise<Restaurant | undefined>;
  getRestaurantByPlaceId(placeId: string): Promise<Restaurant | undefined>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  
  // Scan methods
  getScan(id: number): Promise<Scan | undefined>;
  getLatestScanForRestaurant(restaurantId: number): Promise<Scan | undefined>;
  createScan(scan: InsertScan): Promise<Scan>;
  getScansByDomain(domain: string): Promise<Scan[]>;
}

export class MemStorage implements IStorage {
  private restaurants: Map<number, Restaurant>;
  private scans: Map<number, Scan>;
  private restaurantIdCounter: number;
  private scanIdCounter: number;

  constructor() {
    this.restaurants = new Map();
    this.scans = new Map();
    this.restaurantIdCounter = 1;
    this.scanIdCounter = 1;
  }

  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    return this.restaurants.get(id);
  }

  async getRestaurantByPlaceId(placeId: string): Promise<Restaurant | undefined> {
    return Array.from(this.restaurants.values()).find(
      (restaurant) => restaurant.placeId === placeId
    );
  }

  async createRestaurant(insertRestaurant: InsertRestaurant): Promise<Restaurant> {
    const id = this.restaurantIdCounter++;
    const restaurant: Restaurant = {
      ...insertRestaurant,
      id,
      placeId: insertRestaurant.placeId ?? null,
      domain: insertRestaurant.domain ?? null,
      rating: insertRestaurant.rating ?? null,
      totalRatings: insertRestaurant.totalRatings ?? null,
      priceLevel: insertRestaurant.priceLevel ?? null,
      createdAt: new Date(),
    };
    this.restaurants.set(id, restaurant);
    return restaurant;
  }

  async getScan(id: number): Promise<Scan | undefined> {
    return this.scans.get(id);
  }

  async getLatestScanForRestaurant(restaurantId: number): Promise<Scan | undefined> {
    const restaurantScans = Array.from(this.scans.values()).filter(
      (scan) => scan.restaurantId === restaurantId
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
      restaurantId: insertScan.restaurantId ?? null,
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
}

export const storage = new MemStorage();
