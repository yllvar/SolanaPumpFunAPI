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
        const coinData = await getCoinData(mintStr);
        if (!coinData) {
            throw new Error('Failed to fetch coin data');
        }

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

        return analysis;
    } catch (error) {
        console.error('Error analyzing coin data:', error);
        throw error;
    }
}

function calculateLiquidityScore(coinData: any): number {
    // Implement liquidity score calculation
    // This is a placeholder implementation
    return Math.min(100, (coinData.volume_24h / coinData.market_cap) * 100);
}

function calculateVolatilityScore(coinData: any): number {
    // Implement volatility score calculation
    // This is a placeholder implementation
    return Math.min(100, Math.abs(coinData.price_change_24h) * 10);
}

function determineTrend(coinData: any): string {
    if (coinData.price_change_24h > 1) return "Bullish";
    if (coinData.price_change_24h < -1) return "Bearish";
    return "Neutral";
}

