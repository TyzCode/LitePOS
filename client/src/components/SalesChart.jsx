import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
} from "chart.js";
import { salesAPI } from "../services/api.js";
import './SalesChart.css';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const SalesChart = ({range, setRange}) => {
    const [chartData, setChartData] = useState([]);
    const [totalSales, setTotalSales] = useState(0);

    useEffect(() => {
        const fetchSales = async () => {
            try {
                const res = await salesAPI.getStats(range);
                setChartData(res.data);
                const sum = res.data.reduce((acc, cur) => acc + cur.totalSales, 0);
                setTotalSales(sum);
            } catch (err) {
                console.error("Error fetching sales data", err);
            }
        };
        fetchSales();
    }, [range]);

    const lineData = {
        labels: chartData.map((s) => s._id),
        datasets: [
            {
                label: `Sales (Last ${range} Days)`,
                data: chartData.map((s) => s.totalSales),
                borderColor: "#2563eb",
                tension: 0.3,
            },
        ],
    };

    return (
        <div className="chart-container">
            <p className="sales-total">
                ₱{totalSales.toFixed(2)}
            </p>
            <div className="range-buttons">
                <button className={`range-btn ${range === "7d" ? "active" : ""}`} onClick={() => setRange("7d")}>7 Days</button>
                <button className={`range-btn ${range === "14d" ? "active" : ""}`} onClick={() => setRange("14d")}>14 Days</button>
                <button className={`range-btn ${range === "30d" ? "active" : ""}`} onClick={() => setRange("30d")}>30 Days</button>
                <button className={`range-btn ${range === "365d" ? "active" : ""}`} onClick={() => setRange("365d")}>1 Year</button>
            </div>
            <div className="sales-chart">
                <Line data={lineData} />
            </div>
        </div>
    );
};

export default SalesChart;