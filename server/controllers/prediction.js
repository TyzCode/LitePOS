import Sale from '../models/Sale.js';
import Product from '../models/Product.js';

// Helper: Calculate moving average
const calculateMovingAverage = (data, days) => {
    if (data.length < days) return null;
    const sum = data.slice(0, days).reduce((acc, val) => acc + val, 0);
    return sum / days;
};

// Helper: Calculate simple linear regression
const calculateTrend = (data) => {
    const n = data.length;
    if (n < 2) return { slope: 0, intercept: data[0] || 0 };

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += data[i];
        sumXY += i * data[i];
        sumXX += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
};

// Main prediction controller
export const getPredictions = async (req, res) => {
    try {
        // Get all products and their current inventory levels
        const products = await Product.find();
        
        // Get sales data for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const sales = await Sale.find({
            createdAt: { $gte: thirtyDaysAgo },
            status: { $in: ['completed', 'successful'] }
        });

        // Process each product
        const predictions = await Promise.all(products.map(async (product) => {
            // Get daily sales quantities for this product
            const dailySales = new Array(30).fill(0);
            
            sales.forEach(sale => {
                const saleDate = new Date(sale.createdAt);
                const dayIndex = 29 - Math.floor((Date.now() - saleDate) / (1000 * 60 * 60 * 24));
                if (dayIndex >= 0) {
                    const productSale = sale.items.find(item => 
                        String(item.productId) === String(product._id)
                    );
                    if (productSale) {
                        dailySales[dayIndex] += Number(productSale.qty || 0);
                    }
                }
            });

            // Calculate predictions
            const trend = calculateTrend(dailySales);
            const movingAvg7 = calculateMovingAverage(dailySales, 7) || 0;
            const movingAvg14 = calculateMovingAverage(dailySales, 14) || 0;

            // Predict next 7 days
            const nextWeekPredictions = Array(7).fill(0).map((_, i) => {
                const trendPrediction = trend.intercept + trend.slope * (dailySales.length + i);
                const avgPrediction = (movingAvg7 * 0.6) + (movingAvg14 * 0.4);
                // Combine trend and moving averages with weights
                return Math.max(0, Math.round((trendPrediction * 0.3) + (avgPrediction * 0.7)));
            });

            // Calculate risk levels
            const currentStock = Number(product.quantity || 0);
            const predictedWeeklyDemand = nextWeekPredictions.reduce((a, b) => a + b, 0);
            const daysUntilStockout = currentStock / (predictedWeeklyDemand / 7);
            
            let riskLevel = 'low';
            if (daysUntilStockout < 7) riskLevel = 'high';
            else if (daysUntilStockout < 14) riskLevel = 'medium';

            return {
                productId: product._id,
                name: product.name,
                currentStock,
                dailySales: dailySales,
                predictions: nextWeekPredictions,
                riskLevel,
                metrics: {
                    averageDailySales: movingAvg7,
                    daysUntilStockout: Math.round(daysUntilStockout),
                    trend: trend.slope > 0 ? 'increasing' : trend.slope < 0 ? 'decreasing' : 'stable'
                }
            };
        }));

        res.json({
            success: true,
            predictions: predictions.sort((a, b) => {
                // Sort by risk level (high → medium → low) and then by days until stockout
                const riskOrder = { high: 0, medium: 1, low: 2 };
                return riskOrder[a.riskLevel] - riskOrder[b.riskLevel] || 
                       a.metrics.daysUntilStockout - b.metrics.daysUntilStockout;
            })
        });

    } catch (error) {
        console.error('Prediction error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to generate predictions',
            error: error.message 
        });
    }
};
