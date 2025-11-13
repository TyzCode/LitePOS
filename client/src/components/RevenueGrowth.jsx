import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
} from "chart.js";
import { salesAPI } from "../services/api.js";
import "./RevenueGrowth.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const RevenueGrowthChart = ({ range }) => {
    const [chartData, setChartData] = useState([]);
    const [revenueGrowth, setRevenueGrowth] = useState([]);
    const [latestGrowth, setLatestGrowth] = useState(0);

    useEffect(() => {
        const fetchRevenue = async () => {
            try {
                const res = await salesAPI.getStats(range);

                const sortedData = res.data.sort((a, b) => new Date(a._id) - new Date(b._id));
                setChartData(sortedData);

                const growth = sortedData.map((item, index, arr) => {
                    if (index === 0) return 0;
                    const prev = arr[index - 1].totalSales || 1;
                    return ((item.totalSales - prev) / prev) * 100;
                });
                setRevenueGrowth(growth);

                if (sortedData.length >= 2) {
                    const first = sortedData[0].totalSales;
                    const last = sortedData[sortedData.length - 1].totalSales || 0;
                    const overallGrowth = ((last - first) / first) * 100;
                    setLatestGrowth(overallGrowth);
                } else {
                    setLatestGrowth(0);
                }
            } catch (err) {
                console.error("Error fetching revenue growth:", err);
            }
        };

        fetchRevenue();
    }, [range]);

    const barData = {
        labels: chartData.map((s) => s._id),
        datasets: [
            {
                label: "Revenue Growth Rate (%)",
                data: revenueGrowth,
                backgroundColor: revenueGrowth.map((v) => (v >= 0 ? "#16a34a" : "#dc2626")),
                hoverBackgroundColor: revenueGrowth.map((v) => (v >= 0 ? "#22c55e" : "#ef4444")),
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => `${context.parsed.y.toFixed(2)}%`,
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { callback: (val) => val + "%" },
            },
        },
    };

    return (
        <div className="revenue-container">
            <h2>Total Sales Growth ({range}) </h2>
            <p style={{ fontSize: "22px", fontWeight: "600", marginBottom: "12px", color: latestGrowth >= 0 ? "#16a34a" : "#dc2626" }}>
                {latestGrowth.toFixed(2)}% 
            </p>
            <div className="revenue-chart">
                <Bar data={barData} options={options} />
            </div>
        </div>
    );
};

export default RevenueGrowthChart;
