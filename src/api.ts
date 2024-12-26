import axios from 'axios';

export async function getCoinData(mintStr: string) {
    try {
        const url = `https://frontend-api.pump.fun/coins/${mintStr}`;
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
                "Accept": "*/*",
                "Accept-Language": "en-US,en;q=0.5",
                "Accept-Encoding": "gzip, deflate, br",
                "Referer": "https://www.pump.fun/",
                "Origin": "https://www.pump.fun",
                "Connection": "keep-alive",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "cross-site",
                "If-None-Match": 'W/"43a-tWaCcS4XujSi30IFlxDCJYxkMKg"'
            }
        });
        if (response.status === 200) {
            return response.data;
        } else {
            console.error('Failed to retrieve coin data:', response.status);
            return null;
        }
    } catch (error) {
        console.error('Error fetching coin data:', error);
        return null;
    }
}

export async function analyzeCoinData(mintStr: string) {
    try {
        console.log(`Attempting to fetch coin data for ${mintStr}`);
        const coinData = await getCoinData(mintStr);
        if (!coinData) {
            console.log(`No coin data returned for ${mintStr}`);
            throw new Error('Failed to fetch coin data');
        }
        console.log(`Successfully fetched coin data for ${mintStr}:`, coinData);

        // Perform analysis on the coin data
        const analysis = {
            mintAddress: mintStr,
            totalSupply: coinData.total_supply,
            priceChange24h: coinData.price_change_24h,
            volume24h: coinData.volume_24h,
            marketCap: coinData.market_cap,
            liquidityScore: calculateLiquidityScore(coinData),
            volatilityScore: calculateVolatilityScore(coinData),
            trendIndicator: determineTrend(coinData)
        };

        console.log(`Analysis completed for ${mintStr}:`, analysis);
        return analysis;
    } catch (error) {
        console.error('Error analyzing coin data:', error);
        throw error;
    }
}

function calculateLiquidityScore(coinData: any): number {
    // Liquidity score based on volume to market cap ratio
    // Higher ratio indicates better liquidity
    const volumeToMarketCapRatio = coinData.volume_24h / coinData.market_cap;
    
    // Normalize the score to a 0-100 scale
    // Assuming a ratio of 0.2 (20% daily volume to market cap) is excellent liquidity
    const normalizedScore = Math.min(volumeToMarketCapRatio / 0.2, 1) * 100;
    
    return Math.round(normalizedScore);
}

function calculateVolatilityScore(coinData: any): number {
    // Volatility score based on 24-hour price change percentage
    // Higher absolute change indicates higher volatility
    const absolutePriceChange = Math.abs(coinData.price_change_24h);
    
    // Normalize the score to a 0-100 scale
    // Assuming a 20% daily change is considered highly volatile
    const normalizedScore = Math.min(absolutePriceChange / 20, 1) * 100;
    
    return Math.round(normalizedScore);
}

function determineTrend(coinData: any): string {
    const priceChange = coinData.price_change_24h;
    const volume = coinData.volume_24h;
    const marketCap = coinData.market_cap;

    // Calculate the average daily volume (assuming we have this data)
    // For this example, we'll use 10% of market cap as a benchmark
    const avgDailyVolume = marketCap * 0.1;

    if (priceChange > 5 && volume > avgDailyVolume) {
        return "Strongly Bullish";
    } else if (priceChange > 2 || (priceChange > 0 && volume > avgDailyVolume)) {
        return "Bullish";
    } else if (priceChange < -5 && volume > avgDailyVolume) {
        return "Strongly Bearish";
    } else if (priceChange < -2 || (priceChange < 0 && volume > avgDailyVolume)) {
        return "Bearish";
    } else {
        return "Neutral";
    }
}

