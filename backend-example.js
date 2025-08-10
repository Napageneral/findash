// Optional Node.js backend for advanced VPS deployment
// This handles CORS issues and provides data caching

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for your frontend domain
app.use(cors({
    origin: ['http://localhost:3000', 'https://yourdomain.com'],
    credentials: true
}));

app.use(express.json());

// Configuration - Use environment variables in production
const CONFIG = {
    ALPHA_VANTAGE_KEY: process.env.ALPHA_VANTAGE_KEY || '',
    FRED_API_KEY: process.env.FRED_API_KEY || '',
    FMP_API_KEY: process.env.FMP_API_KEY || '',
    
    // Cache duration in minutes
    CACHE_DURATION: 5
};

// In-memory cache (use Redis in production)
const cache = new Map();

// Cache utilities
function getCacheKey(endpoint) {
    return `cache_${endpoint}`;
}

function isCacheValid(cacheEntry) {
    if (!cacheEntry) return false;
    const now = Date.now();
    return (now - cacheEntry.timestamp) < (CONFIG.CACHE_DURATION * 60 * 1000);
}

function setCache(key, data) {
    cache.set(key, {
        data,
        timestamp: Date.now()
    });
}

function getCache(key) {
    const cacheEntry = cache.get(key);
    return isCacheValid(cacheEntry) ? cacheEntry.data : null;
}

// Market data fetchers
class BackendMarketFetcher {
    async fetchCryptoData() {
        const cacheKey = getCacheKey('crypto');
        const cached = getCache(cacheKey);
        if (cached) return cached;

        try {
            const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
                params: {
                    ids: 'bitcoin,ethereum,tether,usd-coin,binance-usd,dai',
                    vs_currencies: 'usd',
                    include_24hr_change: true,
                    include_market_cap: true
                }
            });
            
            setCache(cacheKey, response.data);
            return response.data;
        } catch (error) {
            console.error('Crypto fetch error:', error);
            return null;
        }
    }

    async fetchStockData(symbol) {
        const cacheKey = getCacheKey(`stock_${symbol}`);
        const cached = getCache(cacheKey);
        if (cached) return cached;

        // Try multiple sources
        let data = null;

        // Try Financial Modeling Prep first
        if (CONFIG.FMP_API_KEY) {
            try {
                const response = await axios.get(`https://financialmodelingprep.com/api/v3/quote/${symbol}`, {
                    params: { apikey: CONFIG.FMP_API_KEY }
                });
                if (response.data && response.data[0]) {
                    data = {
                        price: response.data[0].price,
                        change: response.data[0].changesPercentage,
                        source: 'fmp'
                    };
                }
            } catch (error) {
                console.error('FMP error:', error);
            }
        }

        // Try Alpha Vantage as fallback
        if (!data && CONFIG.ALPHA_VANTAGE_KEY) {
            try {
                const response = await axios.get('https://www.alphavantage.co/query', {
                    params: {
                        function: 'GLOBAL_QUOTE',
                        symbol: symbol,
                        apikey: CONFIG.ALPHA_VANTAGE_KEY
                    }
                });
                
                if (response.data['Global Quote']) {
                    const quote = response.data['Global Quote'];
                    data = {
                        price: parseFloat(quote['05. price']),
                        change: parseFloat(quote['10. change percent'].replace('%', '')),
                        source: 'alphavantage'
                    };
                }
            } catch (error) {
                console.error('Alpha Vantage error:', error);
            }
        }

        // Try Yahoo Finance as last resort
        if (!data) {
            try {
                const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                if (response.data.chart && response.data.chart.result) {
                    const result = response.data.chart.result[0];
                    const price = result.meta.regularMarketPrice;
                    const previousClose = result.meta.previousClose;
                    const change = ((price - previousClose) / previousClose * 100);
                    
                    data = {
                        price: price,
                        change: change,
                        source: 'yahoo'
                    };
                }
            } catch (error) {
                console.error('Yahoo Finance error:', error);
            }
        }

        if (data) {
            setCache(cacheKey, data);
        }
        
        return data;
    }

    async fetchCommodityData() {
        const cacheKey = getCacheKey('commodities');
        const cached = getCache(cacheKey);
        if (cached) return cached;

        const commodities = {};

        // Fetch oil data
        if (CONFIG.ALPHA_VANTAGE_KEY) {
            try {
                const response = await axios.get('https://www.alphavantage.co/query', {
                    params: {
                        function: 'WTI',
                        interval: 'daily',
                        apikey: CONFIG.ALPHA_VANTAGE_KEY
                    }
                });
                
                if (response.data.data) {
                    commodities.oil = {
                        price: parseFloat(response.data.data[0].value),
                        change: -9.0 // YTD from analysis
                    };
                }
            } catch (error) {
                console.error('Oil data error:', error);
            }
        }

        // Add gold price (try metals.live)
        try {
            const response = await axios.get('https://api.metals.live/v1/spot/gold');
            commodities.gold = {
                price: response.data.price,
                change: 28.5
            };
        } catch (error) {
            commodities.gold = { price: 2650, change: 28.5 };
        }

        setCache(cacheKey, commodities);
        return commodities;
    }

    async fetchEconomicData() {
        const cacheKey = getCacheKey('economic');
        const cached = getCache(cacheKey);
        if (cached) return cached;

        const economicData = {};

        // Buffett Indicator from FRED
        if (CONFIG.FRED_API_KEY) {
            try {
                const response = await axios.get('https://api.stlouisfed.org/fred/series/observations', {
                    params: {
                        series_id: 'DDDM01USA156NWDB',
                        api_key: CONFIG.FRED_API_KEY,
                        file_type: 'json',
                        limit: 1,
                        sort_order: 'desc'
                    }
                });
                
                if (response.data.observations) {
                    economicData.buffettIndicator = parseFloat(response.data.observations[0].value);
                }
            } catch (error) {
                console.error('FRED error:', error);
            }
        }

        // Default values from McGlone analysis
        if (!economicData.buffettIndicator) {
            economicData.buffettIndicator = 185;
        }

        economicData.chinaBondYield = 1.71;
        economicData.btcCorrelation = 0.72;

        setCache(cacheKey, economicData);
        return economicData;
    }
}

const fetcher = new BackendMarketFetcher();

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        cache_size: cache.size
    });
});

app.get('/api/market-data', async (req, res) => {
    try {
        console.log('Fetching market data...');
        
        const [cryptoData, sp500Data, commodityData, economicData] = await Promise.all([
            fetcher.fetchCryptoData(),
            fetcher.fetchStockData('^GSPC'),
            fetcher.fetchCommodityData(),
            fetcher.fetchEconomicData()
        ]);

        const marketData = {
            crypto: cryptoData,
            sp500: sp500Data,
            commodities: commodityData,
            economic: economicData,
            timestamp: new Date().toISOString(),
            sources: {
                crypto: 'coingecko',
                stocks: sp500Data?.source || 'fallback',
                commodities: 'multiple',
                economic: 'fred+analysis'
            }
        };

        res.json(marketData);
    } catch (error) {
        console.error('Market data error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch market data',
            message: error.message 
        });
    }
});

// Individual endpoint routes
app.get('/api/crypto', async (req, res) => {
    try {
        const data = await fetcher.fetchCryptoData();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/stocks/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const data = await fetcher.fetchStockData(symbol.toUpperCase());
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/commodities', async (req, res) => {
    try {
        const data = await fetcher.fetchCommodityData();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/economic', async (req, res) => {
    try {
        const data = await fetcher.fetchEconomicData();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cache management
app.get('/api/cache/clear', (req, res) => {
    cache.clear();
    res.json({ message: 'Cache cleared', size: cache.size });
});

app.get('/api/cache/stats', (req, res) => {
    const stats = {
        size: cache.size,
        keys: Array.from(cache.keys()),
        memoryUsage: process.memoryUsage()
    };
    res.json(stats);
});

// Scheduled cache cleanup (every hour)
cron.schedule('0 * * * *', () => {
    console.log('Cleaning expired cache entries...');
    for (const [key, entry] of cache.entries()) {
        if (!isCacheValid(entry)) {
            cache.delete(key);
        }
    }
    console.log(`Cache cleaned. Current size: ${cache.size}`);
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Market Data API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Cache duration: ${CONFIG.CACHE_DURATION} minutes`);
    
    // Log API key status
    console.log('API Key Status:');
    console.log(`- Alpha Vantage: ${CONFIG.ALPHA_VANTAGE_KEY ? '✓' : '✗'}`);
    console.log(`- FRED: ${CONFIG.FRED_API_KEY ? '✓' : '✗'}`);
    console.log(`- FMP: ${CONFIG.FMP_API_KEY ? '✓' : '✗'}`);
});

module.exports = app;
