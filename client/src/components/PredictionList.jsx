import React, { useEffect, useState } from "react";
import { predictionAPI } from "../services/api.js";
import './PredictionList.css';

const PredictionList = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('weekly');

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const { data } = await predictionAPI.getPredictions(period);
        setPredictions(data);
      } catch (err) {
        console.error("Failed to load predictions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPredictions();
  }, [period]);

  const getPredictionKey = () => {
    return period === 'weekly'
      ? 'predictedSalesNextWeek'
      : 'predictedSalesNextMonth';
  };

  if (loading) return <p>Loading predictions...</p>;

  return (
    <>
      <h3>{period === 'weekly' ? 'Predicted Sales Next Week' : 'Predicted Sales Next Month'}</h3>
      <div className="prediction-list-container">
        {/* Toggle Buttons */}
        <div className="period-buttons">
          <button
            className={period === 'weekly' ? 'active' : ''}
            onClick={() => setPeriod('weekly')}
            disabled={loading}
          >
            Week
          </button>
          <button
            className={period === 'monthly' ? 'active' : ''}
            onClick={() => setPeriod('monthly')}
            disabled={loading}
          >
            Month
          </button>
        </div>

        {/* Prediction List */}
        <table className="prediction-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Predicted Sales {period === 'weekly' ? '(W)' : '(M)'}</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map((item) => {
              const predictionKey = getPredictionKey();

              return (
                <tr key={item.productId}>
                  <td>{item.productName}</td>
                  <td>{item[predictionKey]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default PredictionList;
