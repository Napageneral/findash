# Palisades Gold Radio - Market Risk Dashboard

A comprehensive financial dashboard based on Mike McGlone's market analysis from the Palisades Gold Radio podcast, featuring real-time data from multiple financial APIs.

![Dashboard Preview](https://img.shields.io/badge/Dashboard-Live%20Data-gold?style=for-the-badge)

## Features

🏆 **Real-Time Market Data**
- Live cryptocurrency prices (Bitcoin, Ethereum, stablecoins)
- S&P 500 and equity market data
- Commodity prices (Gold, Oil, Copper, Grains)
- Economic indicators (China bond yields, Buffett indicator)

📊 **Key Metrics from McGlone's Analysis**
- Market Cap/GDP ratio (Buffett Indicator) - showing extreme overvaluation
- Bitcoin-S&P correlation analysis
- Central bank gold purchasing trends
- Gold ETF flow reversals
- Commodity price projections

🎨 **Professional Design**
- Dark theme with gold accents
- Mobile-responsive grid layout
- Real-time status indicators
- Interactive hover effects
- Auto-refresh every 5 minutes

## Quick Start

### Option 1: Immediate Deployment (Works Out of the Box)
1. Upload `index.html` to your VPS web server
2. Access via your domain - the dashboard will work immediately with:
   - Live crypto data (CoinGecko - no API key needed)
   - Fallback data for other assets based on podcast values

### Option 2: Full Real-Time Data (Recommended)
Get free API keys and add them to the CONFIG section in `index.html`:

```javascript
const CONFIG = {
    ALPHA_VANTAGE_KEY: 'your-key-here',    // Free: alphavantage.co
    FRED_API_KEY: 'your-key-here',         // Free: fred.stlouisfed.org
    FMP_API_KEY: 'your-key-here',          // Free: financialmodelingprep.com
};
```

## API Setup Instructions

### 1. Alpha Vantage (Stocks & Commodities)
- **Website**: https://www.alphavantage.co/support/#api-key
- **Free Tier**: 5 calls/minute, 500 calls/day
- **Provides**: S&P 500, WTI Oil, stock data
- **Setup**: Sign up → Get API key → Add to CONFIG

### 2. FRED (Federal Reserve Economic Data)
- **Website**: https://fred.stlouisfed.org/docs/api/api_key.html
- **Free Tier**: Unlimited (with rate limits)
- **Provides**: Market Cap/GDP ratio, economic indicators
- **Setup**: Create account → Request API key → Add to CONFIG

### 3. Financial Modeling Prep (Alternative Stock Data)
- **Website**: https://financialmodelingprep.com/developer/docs
- **Free Tier**: 250 calls/day
- **Provides**: Real-time stock quotes, financial data
- **Setup**: Sign up → Get API key → Add to CONFIG

### 4. CoinGecko (Cryptocurrency) - Already Working!
- **No API key needed** for basic data
- **Provides**: Bitcoin, Ethereum, stablecoin prices
- **Rate Limits**: 50 calls/minute for demo endpoints

## VPS Deployment

### Requirements
- Web server (Apache, Nginx, or any HTTP server)
- Modern browser support (Chrome, Firefox, Safari, Edge)
- Internet connection for API calls

### Simple Deployment
```bash
# Upload to your web server
scp index.html user@your-vps:/var/www/html/

# Or with git
git clone [your-repo] /var/www/html/dashboard
```

### Advanced Setup with Backend (Optional)
For production use, consider setting up a backend API:

```bash
# Create a Node.js backend to handle CORS and caching
npm init -y
npm install express axios cors node-cron

# See backend-example.js in the repo for a complete setup
```

## Dashboard Metrics Explained

### Market Risk Indicators
- **Buffett Indicator (185%)**: Market cap/GDP ratio at historic highs
- **China 10Y Bond (1.71%)**: Historic low showing deflation
- **BTC-S&P Correlation (0.72)**: High correlation shows risk-on behavior

### Asset Performance (YTD)
- **Bitcoin**: +115% (leading performer)
- **Gold**: +28.5% (safe haven demand)
- **S&P 500**: +24.1% (continued rally)
- **Commodities**: Negative (oil -9%, grains -16%)

### McGlone's Key Predictions
- **Gold Target**: $4,000/oz (from current ~$2,650)
- **Copper Decline**: $4.20 → $3.00 due to tariffs
- **Market Risk**: Extreme overvaluation signals

## Browser Support
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Features
- **Auto-refresh**: Updates every 5 minutes
- **Caching**: 1-minute cache to avoid API rate limits
- **Error Handling**: Graceful fallbacks when APIs are unavailable
- **Mobile Optimized**: Responsive design for all screen sizes

## Customization

### Adding New Metrics
```javascript
// Add to MarketDataFetcher class
async fetchNewMetric() {
    try {
        const response = await axios.get('your-api-endpoint');
        return response.data;
    } catch (error) {
        return fallbackValue;
    }
}
```

### Styling Changes
Modify the CSS variables in the `<style>` section:
```css
:root {
    --primary-gold: #ffd700;
    --primary-cyan: #64ffda;
    --background-dark: #0a0e27;
    --card-background: rgba(20, 25, 45, 0.9);
}
```

## Troubleshooting

### Common Issues
1. **CORS Errors**: Use the provided CORS proxy or set up backend
2. **API Rate Limits**: Dashboard handles this automatically with caching
3. **Data Not Loading**: Check browser console for specific API errors

### Debug Mode
Open browser developer tools and check the console for detailed logs:
- API call status
- Data fetch results
- Error messages

## License
MIT License - Feel free to modify and use for your own projects.

## Acknowledgments
- Based on Mike McGlone's market analysis from Palisades Gold Radio
- Market data provided by CoinGecko, Alpha Vantage, FRED, and other sources
- Chart.js for beautiful visualizations

---

**Note**: This dashboard is for educational and informational purposes. Always do your own research before making investment decisions.
