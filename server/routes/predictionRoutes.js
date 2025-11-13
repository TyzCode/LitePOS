import express from "express";
import mongoose from "mongoose";
import * as Regression from "ml-regression-simple-linear";

const router = express.Router();

const Sale = mongoose.connection.collection("Sales");
const Inventory = mongoose.connection.collection("Inventory");

const MLR = Regression.SimpleLinearRegression;

router.get("/predict", async (req, res) => {
  try {
    const period = req.query.period || "weekly";

    let days = 30;
    let predictionSteps = 7;
    let dateFormat = "%Y-%m-%d";
    let predictionKey = "predictedSalesNextWeek";

    if (period === "monthly") {
      days = 365;
      predictionSteps = 1;
      dateFormat = "%Y-%m";
      predictionKey = "predictedSalesNextMonth";
    }
    const startDate = new Date();
    if (period === "monthly") {
      startDate.setDate(1);
      startDate.setMonth(startDate.getMonth() - days / 30);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate.setDate(startDate.getDate() - days);
    }

    const salesData = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ["successful"] },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: {
            productId: "$items._id",
            date: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          },
          totalSold: { $sum: "$items.qty" },
        },
      },
      {
        $group: {
          _id: "$_id.productId",
          dailySales: { $push: { date: "$_id.date", totalSold: "$totalSold" } },
        },
      },
    ]).toArray();

    const predictions = await Promise.all(
      salesData.map(async (productSales) => {
        const product = await Inventory.findOne({
          _id: new mongoose.Types.ObjectId(productSales._id),
        });
        if (!product) return null;

        const sorted = productSales.dailySales.sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );

        const x = sorted.map((_, i) => i + 1);
        const y = sorted.map((s) => s.totalSold);

        if (x.length < 2) {
          return {
            productId: product._id,
            productName: product.name,
            [predictionKey]: "Insufficient data",
          };
        }

        const regression = new MLR(x, y);
        const lastX = x[x.length - 1];
        let totalPredicted = 0;

        for (let i = 1; i <= predictionSteps; i++) {
          totalPredicted += Math.max(0, regression.predict(lastX + i));
        }

        return {
          productId: product._id,
          productName: product.name,
          [predictionKey]: Math.round(totalPredicted),
        };
      })
    );

    res.json(predictions.filter(Boolean));
  } catch (err) {
    console.error("Prediction error:", err);
    res.status(500).json({ message: "Prediction failed" });
  }
});

export default router;
