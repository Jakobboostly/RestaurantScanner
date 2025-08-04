# 🥡 Restaurant Scanner — **DataForSEO Edition**

Everything below lives in one file (e.g. `README.md` or Replit’s “Prompt”) so you can paste it straight into a fresh Node Repl and hit **Run**.

---

## 1 · Environment setup

```bash
# 1) Initialise a vanilla Node 18 project
npm init -y
npm i axios dotenv

# 2) Create your environment file
echo 'DATAFORSEO_LOGIN=your@email
DATAFORSEO_PASSWORD=your_api_password
' > .env
DataForSEO uses Basic-Auth (login + password) instead of API-key headers.

2 · api.js — ultra-thin DataForSEO client
js
Copy
Edit
// api.js  (ES modules)
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const { DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD } = process.env;
const client = axios.create({
  baseURL: "https://api.dataforseo.com/v3",
  auth: { username: DATAFORSEO_LOGIN, password: DATAFORSEO_PASSWORD },
  headers: { "Content-Type": "application/json" },
});

/* ── 1. Restaurant search ───────────────────────────────────────────── */
export async function searchRestaurants({
  query,
  lat,
  lng,
  radiusMeters = 5_000,
  limit = 10,
}) {
  const task = {
    keyword: query,
    location_coordinates: `${lat},${lng}`,
    radius: radiusMeters,
    limit,
  };
  const { data } = await client.post(
    "/business_data/business_listings/search/live",
    [task],
  );
  return data.tasks[0].result;
}

/* ── 2. Restaurant details (GMB profile) ────────────────────────────── */
export async function getRestaurantDetails(cid) {
  const { data } = await client.post(
    "/business_data/google/my_business_info/live",
    [{ id: cid }],
  );
  return data.tasks[0].result;
}

/* ── 3. Core Web Vitals via Lighthouse ──────────────────────────────── */
export async function auditPerformance(url) {
  const { data } = await client.post(
    "/on_page/lighthouse/live/json",
    [{ url, tag: "live-audit" }],
  );
  return data.tasks[0].result;
}

/* ── 4. Keyword rank check ──────────────────────────────────────────── */
export async function trackKeyword({
  keyword,
  domain,
  location_name = "United States",
}) {
  const task = {
    keyword,
    target: domain,
    location_name,
    language_code: "en",
  };
  const { data } = await client.post(
    "/serp/google/organic/live/advanced",
    [task],
  );
  return data.tasks[0].result;
}

/* ── 5. Nearby competitors (reuse search) ───────────────────────────── */
export async function findCompetitors({
  lat,
  lng,
  radiusMeters = 3_000,
  limit = 10,
}) {
  return searchRestaurants({ query: "", lat, lng, radiusMeters, limit });
}
3 · scanner.js — orchestration demo
js
Copy
Edit
// scanner.js
import {
  searchRestaurants,
  getRestaurantDetails,
  auditPerformance,
  trackKeyword,
  findCompetitors,
} from "./api.js";

(async () => {
  const [pizzaPlace] = await searchRestaurants({
    query: "pizza",
    lat: 40.7128,
    lng: -74.006,
  });

  const details      = await getRestaurantDetails(pizzaPlace.cid);
  const webVitals    = await auditPerformance(details.website);
  const serpPosition = await trackKeyword({
    keyword: "best pizza near me",
    domain: new URL(details.website).hostname,
  });
  const competitors  = await findCompetitors({
    lat: pizzaPlace.location.lat,
    lng: pizzaPlace.location.lng,
  });

  console.log({ details, webVitals, serpPosition, competitors });
})();
Run with:

bash
Copy
Edit
node scanner.js
4 · Mapping cheat-sheet
Original API / Task	DataForSEO Endpoint	What You Get
Google Places Text-Search	/business_data/business_listings/search/live	Live list with ratings, contacts, coordinates
Google Places Details	/business_data/google/my_business_info/live	Full GMB profile (hours, CID, website, etc.)
PageSpeed Insights	/on_page/lighthouse/live/json	Core Web Vitals & Lighthouse JSON
SERP API Keyword Rank	/serp/google/organic/live/advanced	Top-100 organic positions + domain filter
Places Nearby Search (competitors)	Same Business Listings call, blank keyword, small radius	Competitor list in one hit
Puppeteer screenshots / DOM checks	Keep as-is (cheaper than paid screenshot tasks)	Mobile screenshots, custom DOM analysis

5 · Quota, latency & error tips
One API call = one “task”. Expect ≈10 ms per task on Live routes.

Parallelism: Stay under ~200 tasks/s on Replit free tier to avoid 429s.

Soft errors: 422 “Task creation failed” is transient — retry with exponential back-off.

Empty results: DataForSEO responds HTTP 200 even when nothing’s found. Check tasks[0].status_message before trusting result.

6 · Remove these from your old stack
.env keys: GOOGLE_API_KEY, GOOGLE_PLACES_API_KEY, PAGESPEED_API_KEY, SERP_API_KEY

All endpoints hitting maps.googleapis.com or pagespeedonline.googleapis.com

Mock-data fallbacks (Lighthouse JSON already returns complete synthetic data)

