/**
 * Polymarket API Testing Script
 * Tests all available crypto events and markets endpoints using GET requests
 * Supports both offset-based and keyset pagination
 */

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';
const CLOB_API_BASE = 'https://clob.polymarket.com';
const DATA_API_BASE = 'https://data-api.polymarket.com';

interface ApiResponse<T> {
  data: T;
  status: number;
  ok: boolean;
}

interface Event {
  id: string;
  ticker?: string;
  slug?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  liquidity?: number;
  volume?: number;
  category?: string;
  subcategory?: string;
  // Add other Event properties as needed
}

interface Market {
  id: string;
  question?: string;
  conditionId: string;
  slug?: string;
  endDate?: string;
  category?: string;
  liquidity?: string;
  volume?: string;
  active?: boolean;
  closed?: boolean;
  marketType?: string;
  clobTokenIds?: string;
  outcomes?: string;
  outcomePrices?: string;
  outcomePricesNum?: number[];
  price?: number;
  bestBid?: number;
  bestAsk?: number;
  lastTradePrice?: number;
  tokenName?: string;
  // Add other Market properties as needed
}

interface KeysetResponse<T> {
  data: T[];
  next_cursor?: string;
}

interface Tag {
  id: string;
  label?: string;
  slug?: string;
}

interface Holder {
  address: string;
  balance: number;
}

interface OpenInterest {
  market: string;
  openInterest: number;
}

interface LiveVolume {
  id: string;
  volumes: {
    market: string;
    volume: number;
  }[];
}

/**
 * Generic GET request function with error handling
 */
async function getRequest<T>(url: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    return {
      data,
      status: response.status,
      ok: response.ok,
    };
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

/**
 * Test endpoint and log results
 */
function testEndpoint<T>(endpointName: string, result: ApiResponse<T>) {
  console.log(`\n=== Testing: ${endpointName} ===`);
  console.log(`Status: ${result.status} ${result.ok ? '✓' : '✗'}`);
  
  if (result.ok) {
    const data = result.data as any;
    if (Array.isArray(data)) {
      console.log(`Results: ${data.length} items`);
    } else if (data && typeof data === 'object') {
      if (data.data && Array.isArray(data.data)) {
        console.log(`Results: ${data.data.length} items`);
        if (data.next_cursor) {
          console.log(`Next cursor: ${data.next_cursor}`);
        }
      } else {
        console.log(`Results: 1 item`);
      }
    }
  } else {
    console.log(`Error:`, result.data);
  }
  
  return result;
}

/**
 * Fetch events with offset-based pagination
 */
async function fetchEventsOffset(params: {
  limit?: number;
  offset?: number;
  tag_slug?: string;
  active?: boolean;
  closed?: boolean;
  [key: string]: any;
} = {}): Promise<ApiResponse<Event[]>> {
  const queryParams = new URLSearchParams();
  
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.offset) queryParams.append('offset', params.offset.toString());
  if (params.tag_slug) queryParams.append('tag_slug', params.tag_slug);
  if (params.active !== undefined) queryParams.append('active', params.active.toString());
  if (params.closed !== undefined) queryParams.append('closed', params.closed.toString());
  
  const url = `${GAMMA_API_BASE}/events?${queryParams.toString()}`;
  return getRequest<Event[]>(url);
}

/**
 * Fetch all events with offset-based pagination
 */
async function fetchAllEventsOffset(params: any = {}): Promise<Event[]> {
  const limit = 100;
  let offset = 0;
  let allEvents: Event[] = [];
  
  console.log('\n=== Fetching All Events (Offset Pagination) ===');
  
  while (true) {
    const result = await fetchEventsOffset({ ...params, limit, offset });
    testEndpoint(`GET /events (offset=${offset})`, result);
    
    if (!result.ok || !Array.isArray(result.data)) {
      break;
    }
    
    allEvents = allEvents.concat(result.data);
    
    if (result.data.length < limit) {
      break;
    }
    
    offset += limit;
  }
  
  console.log(`\nTotal events fetched: ${allEvents.length}`);
  return allEvents;
}

/**
 * Fetch events with keyset pagination
 */
async function fetchEventsKeyset(params: {
  limit?: number;
  after_cursor?: string;
  tag_slug?: string;
  active?: boolean;
  closed?: boolean;
  [key: string]: any;
} = {}): Promise<ApiResponse<KeysetResponse<Event>>> {
  const queryParams = new URLSearchParams();
  
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.after_cursor) queryParams.append('after_cursor', params.after_cursor);
  if (params.tag_slug) queryParams.append('tag_slug', params.tag_slug);
  if (params.active !== undefined) queryParams.append('active', params.active.toString());
  if (params.closed !== undefined) queryParams.append('closed', params.closed.toString());
  
  const url = `${GAMMA_API_BASE}/events/keyset?${queryParams.toString()}`;
  return getRequest<KeysetResponse<Event>>(url);
}

/**
 * Fetch all events with keyset pagination (with limits to avoid infinite loops)
 */
async function fetchAllEventsKeyset(params: any = {}, maxPages: number = 5): Promise<Event[]> {
  const limit = 100;
  let afterCursor: string | undefined;
  let allEvents: Event[] = [];
  let pageCount = 0;
  
  console.log('\n=== Fetching All Events (Keyset Pagination) ===');
  console.log(`Max pages: ${maxPages}`);
  
  while (pageCount < maxPages) {
    const result = await fetchEventsKeyset({ ...params, limit, after_cursor: afterCursor });
    testEndpoint(`GET /events/keyset ${afterCursor ? `(cursor=${afterCursor.substring(0, 20)}...)` : ''}`, result);
    
    // Stop on error or if no data
    if (!result.ok || !result.data) {
      if (result.status === 500) {
        console.log('Server error encountered, stopping pagination');
      }
      break;
    }
    
    // Extract data array - API may return array directly or wrapped in { events: [...], next_cursor: "..." }
    const responseData = result.data as any;
    
    // Check if data is array directly or wrapped
    let eventsData: Event[];
    let nextCursor: string | undefined;
    
    if (Array.isArray(responseData)) {
      // Data is returned directly as array
      eventsData = responseData;
      nextCursor = undefined; // No cursor for direct array format
    } else if (responseData && typeof responseData === 'object') {
      // Data is wrapped in object with events and next_cursor (API uses 'events' not 'data')
      eventsData = responseData.events || responseData.data;
      nextCursor = responseData.next_cursor;
    } else {
      console.log('Invalid data format');
      break;
    }
    
    if (!Array.isArray(eventsData)) {
      console.log('Invalid data format, expected array');
      break;
    }
    
    allEvents = allEvents.concat(eventsData);
    pageCount++;
    console.log(`  Fetched ${eventsData.length} events from page ${pageCount}`);
    
    // Stop if no cursor
    if (!nextCursor || typeof nextCursor !== 'string') {
      console.log('No more pages available');
      break;
    }
    
    afterCursor = nextCursor;
  }
  
  console.log(`\nTotal events fetched: ${allEvents.length} (from ${pageCount} pages)`);
  return allEvents;
}

/**
 * Fetch event by slug
 */
async function fetchEventBySlug(slug: string): Promise<ApiResponse<Event>> {
  const url = `${GAMMA_API_BASE}/events/slug/${encodeURIComponent(slug)}`;
  return getRequest<Event>(url);
}

/**
 * Fetch event tags by event ID
 */
async function fetchEventTags(eventId: string): Promise<ApiResponse<Tag[]>> {
  const url = `${GAMMA_API_BASE}/events/${eventId}/tags`;
  return getRequest<Tag[]>(url);
}

/**
 * Fetch markets with offset-based pagination
 */
async function fetchMarketsOffset(params: {
  limit?: number;
  offset?: number;
  closed?: boolean;
  [key: string]: any;
} = {}): Promise<ApiResponse<Market[]>> {
  const queryParams = new URLSearchParams();
  
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.offset) queryParams.append('offset', params.offset.toString());
  if (params.closed !== undefined) queryParams.append('closed', params.closed.toString());
  
  const url = `${GAMMA_API_BASE}/markets?${queryParams.toString()}`;
  return getRequest<Market[]>(url);
}

/**
 * Fetch all markets with offset-based pagination
 */
async function fetchAllMarketsOffset(params: any = {}): Promise<Market[]> {
  const limit = 100;
  let offset = 0;
  let allMarkets: Market[] = [];
  
  console.log('\n=== Fetching All Markets (Offset Pagination) ===');
  
  while (true) {
    const result = await fetchMarketsOffset({ ...params, limit, offset });
    testEndpoint(`GET /markets (offset=${offset})`, result);
    
    if (!result.ok || !Array.isArray(result.data)) {
      break;
    }
    
    allMarkets = allMarkets.concat(result.data);
    
    if (result.data.length < limit) {
      break;
    }
    
    offset += limit;
  }
  
  console.log(`\nTotal markets fetched: ${allMarkets.length}`);
  return allMarkets;
}

/**
 * Fetch markets with keyset pagination
 */
async function fetchMarketsKeyset(params: {
  limit?: number;
  after_cursor?: string;
  closed?: boolean;
  [key: string]: any;
} = {}): Promise<ApiResponse<KeysetResponse<Market>>> {
  const queryParams = new URLSearchParams();
  
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.after_cursor) queryParams.append('after_cursor', params.after_cursor);
  if (params.closed !== undefined) queryParams.append('closed', params.closed.toString());
  
  const url = `${GAMMA_API_BASE}/markets/keyset?${queryParams.toString()}`;
  return getRequest<KeysetResponse<Market>>(url);
}

/**
 * Fetch all markets with keyset pagination (with limits to avoid infinite loops)
 */
async function fetchAllMarketsKeyset(params: any = {}, maxPages: number = 5): Promise<Market[]> {
  const limit = 100;
  let afterCursor: string | undefined;
  let allMarkets: Market[] = [];
  let pageCount = 0;
  
  console.log('\n=== Fetching All Markets (Keyset Pagination) ===');
  console.log(`Max pages: ${maxPages}`);
  
  while (pageCount < maxPages) {
    const result = await fetchMarketsKeyset({ ...params, limit, after_cursor: afterCursor });
    testEndpoint(`GET /markets/keyset ${afterCursor ? `(cursor=${afterCursor.substring(0, 20)}...)` : ''}`, result);
    
    // Stop on error or if no data
    if (!result.ok || !result.data) {
      if (result.status === 500) {
        console.log('Server error encountered, stopping pagination');
      }
      break;
    }
    
    // Extract data array - API may return array directly or wrapped in { data: [...], next_cursor: "..." }
    const responseData = result.data as any;
    
    // Check if data is array directly or wrapped
    let marketsData: Market[];
    let nextCursor: string | undefined;
    
    if (Array.isArray(responseData)) {
      // Data is returned directly as array
      marketsData = responseData;
      nextCursor = undefined; // No cursor for direct array format
    } else if (responseData && typeof responseData === 'object') {
      // Data is wrapped in object with markets and next_cursor (API uses 'markets' not 'data')
      marketsData = responseData.markets || responseData.data;
      nextCursor = responseData.next_cursor;
    } else {
      console.log('Invalid data format');
      break;
    }
    
    if (!Array.isArray(marketsData)) {
      console.log('Invalid data format, expected array');
      break;
    }
    
    allMarkets = allMarkets.concat(marketsData);
    pageCount++;
    console.log(`  Fetched ${marketsData.length} markets from page ${pageCount}`);
    
    // Stop if no cursor
    if (!nextCursor || typeof nextCursor !== 'string') {
      console.log('No more pages available');
      break;
    }
    
    afterCursor = nextCursor;
  }
  
  console.log(`\nTotal markets fetched: ${allMarkets.length} (from ${pageCount} pages)`);
  return allMarkets;
}

/**
 * Fetch market by ID
 */
async function fetchMarketById(id: string): Promise<ApiResponse<Market>> {
  const url = `${GAMMA_API_BASE}/markets/${id}`;
  return getRequest<Market>(url);
}

/**
 * Fetch market by slug
 */
async function fetchMarketBySlug(slug: string): Promise<ApiResponse<Market>> {
  const url = `${GAMMA_API_BASE}/markets/slug/${encodeURIComponent(slug)}`;
  return getRequest<Market>(url);
}

/**
 * Fetch market by token ID
 */
async function fetchMarketByToken(tokenId: string): Promise<ApiResponse<Market>> {
  const url = `${CLOB_API_BASE}/markets-by-token/${tokenId}`;
  return getRequest<Market>(url);
}

/**
 * Fetch market tags by market ID
 */
async function fetchMarketTags(marketId: string): Promise<ApiResponse<Tag[]>> {
  const url = `${GAMMA_API_BASE}/markets/${marketId}/tags`;
  return getRequest<Tag[]>(url);
}

/**
 * Fetch top holders for markets
 */
async function fetchHolders(params: {
  limit?: number;
  market?: string;
  minBalance?: number;
} = {}): Promise<ApiResponse<Holder[]>> {
  const queryParams = new URLSearchParams();
  
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.market) queryParams.append('market', params.market);
  if (params.minBalance) queryParams.append('minBalance', params.minBalance.toString());
  
  const url = `${DATA_API_BASE}/holders?${queryParams.toString()}`;
  return getRequest<Holder[]>(url);
}

/**
 * Fetch open interest
 */
async function fetchOpenInterest(market?: string): Promise<ApiResponse<OpenInterest[]>> {
  const queryParams = new URLSearchParams();
  
  if (market) queryParams.append('market', market);
  
  const url = `${DATA_API_BASE}/oi?${queryParams.toString()}`;
  return getRequest<OpenInterest[]>(url);
}

/**
 * Fetch live volume for an event
 */
async function fetchLiveVolume(id: string): Promise<ApiResponse<LiveVolume>> {
  const url = `${DATA_API_BASE}/live-volume?id=${encodeURIComponent(id)}`;
  return getRequest<LiveVolume>(url);
}

/**
 * Display market token details (names, prices, odds, IDs)
 */
function displayMarketTokenDetails(market: Market) {
  if (!market) {
    console.log('\n--- Market Token Details ---');
    console.log('Market is undefined or null');
    console.log('---------------------------');
    return;
  }
  
  console.log('\n--- Market Token Details ---');
  console.log(`ID: ${market.id || 'N/A'}`);
  console.log(`Condition ID: ${market.conditionId || 'N/A'}`);
  console.log(`Token ID: ${market.clobTokenIds || 'N/A'}`);
  console.log(`Token Name: ${market.question || market.tokenName || 'N/A'}`);
  console.log(`Price: ${market.price || market.lastTradePrice || 'N/A'}`);
  console.log(`Best Bid: ${market.bestBid || 'N/A'}`);
  console.log(`Best Ask: ${market.bestAsk || 'N/A'}`);
  console.log(`Last Trade Price: ${market.lastTradePrice || 'N/A'}`);
  console.log(`Outcomes: ${market.outcomes || 'N/A'}`);
  console.log(`Outcome Prices: ${market.outcomePrices || 'N/A'}`);
  console.log(`Outcome Prices (Num): ${market.outcomePricesNum ? JSON.stringify(market.outcomePricesNum) : 'N/A'}`);
  console.log(`Liquidity: ${market.liquidity || 'N/A'}`);
  console.log(`Volume: ${market.volume || 'N/A'}`);
  console.log(`Active: ${market.active ? 'Yes' : 'No'}`);
  console.log(`Closed: ${market.closed ? 'Yes' : 'No'}`);
  console.log('---------------------------');
}

/**
 * Display event details
 */
function displayEventDetails(event: Event) {
  if (!event) {
    console.log('\n--- Event Details ---');
    console.log('Event is undefined or null');
    console.log('---------------------------');
    return;
  }
  
  console.log('\n--- Event Details ---');
  console.log(`ID: ${event.id || 'N/A'}`);
  console.log(`Slug: ${event.slug || 'N/A'}`);
  console.log(`Title: ${event.title || 'N/A'}`);
  console.log(`Ticker: ${event.ticker || 'N/A'}`);
  console.log(`Category: ${event.category || 'N/A'}`);
  console.log(`Subcategory: ${event.subcategory || 'N/A'}`);
  console.log(`Liquidity: ${event.liquidity || 'N/A'}`);
  console.log(`Volume: ${event.volume || 'N/A'}`);
  console.log(`Active: ${event.active ? 'Yes' : 'No'}`);
  console.log(`Closed: ${event.closed ? 'Yes' : 'No'}`);
  console.log(`Archived: ${event.archived ? 'Yes' : 'No'}`);
  console.log('---------------------------');
}

/**
 * Main test function
 */
async function main() {
  console.log('========================================');
  console.log('Polymarket API Testing Script');
  console.log('========================================');
  
  // Test Event Endpoints
  console.log('\n\n### EVENT ENDPOINTS ###');
  
  // Test offset pagination for events
  const eventsOffsetResult = await fetchEventsOffset({ limit: 10 });
  testEndpoint('GET /events (offset pagination)', eventsOffsetResult);
  
  // Test keyset pagination for events
  const eventsKeysetResult = await fetchEventsKeyset({ limit: 10 });
  testEndpoint('GET /events/keyset (keyset pagination)', eventsKeysetResult);
  
  // Fetch all crypto events using keyset pagination (recommended for large datasets)
  const allCryptoEvents = await fetchAllEventsKeyset({ tag_slug: 'crypto' }, 3); // Limit to 3 pages
  
  // Filter out invalid events (must have an id)
  const validEvents = allCryptoEvents.filter(e => e && e.id);
  console.log(`\nValid crypto events fetched: ${validEvents.length}`);
  
  // Display details for first few crypto events
  if (validEvents.length > 0) {
    console.log('\n### First 3 Crypto Events Details ###');
    validEvents.slice(0, 3).forEach((event, index) => {
      console.log(`\nEvent ${index + 1}:`);
      displayEventDetails(event);
    });
  }
  
  // If we have events, test single event endpoints
  if (validEvents.length > 0) {
    const firstEvent = validEvents[0];
    
    if (firstEvent?.slug) {
      const eventBySlug = await fetchEventBySlug(firstEvent.slug);
      testEndpoint(`GET /events/slug/${firstEvent.slug}`, eventBySlug);
    } else {
      console.log('\nFirst event does not have a slug, skipping event-by-slug test');
    }
    
    if (firstEvent?.id) {
      const eventTags = await fetchEventTags(firstEvent.id);
      testEndpoint(`GET /events/${firstEvent.id}/tags`, eventTags);
    }
  }
  
  // Test Market Endpoints
  console.log('\n\n### MARKET ENDPOINTS ###');
  
  // Test offset pagination for markets
  const marketsOffsetResult = await fetchMarketsOffset({ limit: 10 });
  testEndpoint('GET /markets (offset pagination)', marketsOffsetResult);
  
  // Test keyset pagination for markets
  const marketsKeysetResult = await fetchMarketsKeyset({ limit: 10 });
  testEndpoint('GET /markets/keyset (keyset pagination)', marketsKeysetResult);
  
  // Fetch all markets using keyset pagination (recommended for large datasets)
  const allMarkets = await fetchAllMarketsKeyset({ closed: false }, 3); // Limit to 3 pages
  
  // Filter out invalid markets (must have an id and conditionId)
  const validMarkets = allMarkets.filter(m => m && m.id && m.conditionId);
  console.log(`\nValid active markets fetched: ${validMarkets.length}`);
  
  // Display details for first few markets with token information
  if (validMarkets.length > 0) {
    console.log('\n### First 5 Markets Token Details ###');
    validMarkets.slice(0, 5).forEach((market, index) => {
      console.log(`\nMarket ${index + 1}:`);
      displayMarketTokenDetails(market);
    });
  }
  
  // If we have markets, test single market endpoints
  if (validMarkets.length > 0) {
    const firstMarket = validMarkets[0];
    
    const marketById = await fetchMarketById(firstMarket.id);
    testEndpoint(`GET /markets/${firstMarket.id}`, marketById);
    
    if (firstMarket?.slug) {
      const marketBySlug = await fetchMarketBySlug(firstMarket.slug);
      testEndpoint(`GET /markets/slug/${firstMarket.slug}`, marketBySlug);
    } else {
      console.log('\nFirst market does not have a slug, skipping market-by-slug test');
    }
    
    if (firstMarket?.clobTokenIds) {
      const marketByToken = await fetchMarketByToken(firstMarket.clobTokenIds);
      testEndpoint(`GET /markets-by-token/${firstMarket.clobTokenIds}`, marketByToken);
    } else {
      console.log('\nFirst market does not have clobTokenIds, skipping market-by-token test');
    }
    
    const marketTags = await fetchMarketTags(firstMarket.id);
    testEndpoint(`GET /markets/${firstMarket.id}/tags`, marketTags);
  }
  
  // Test Data API Endpoints
  console.log('\n\n### DATA API ENDPOINTS ###');
  
  // Test holders endpoint
  const holders = await fetchHolders({ limit: 10 });
  testEndpoint('GET /holders', holders);
  
  // Test open interest endpoint
  const openInterest = await fetchOpenInterest();
  testEndpoint('GET /oi', openInterest);
  
  // Test live volume endpoint (if we have an event ID)
  if (allCryptoEvents.length > 0) {
    const liveVolume = await fetchLiveVolume(allCryptoEvents[0].id);
    testEndpoint(`GET /live-volume?id=${allCryptoEvents[0].id}`, liveVolume);
  }
  
  console.log('\n\n========================================');
  console.log('API Testing Complete');
  console.log('========================================');
  
  // Summary
  console.log('\n### SUMMARY ###');
  console.log(`Total crypto events fetched: ${allCryptoEvents.length}`);
  console.log(`Total active markets fetched: ${allMarkets.length}`);
}

// Run the script with error handling
async function run() {
  try {
    await main();
  } catch (error) {
    console.error('\n=== FATAL ERROR ===');
    console.error('Script failed with error:', error);
    process.exit(1);
  }
}

run();
