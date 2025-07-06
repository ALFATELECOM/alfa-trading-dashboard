// placeholder contentimport { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function TradingDashboard() {
  const [balance, setBalance] = useState(null);
  const [signal, setSignal] = useState(null);
  const [marketPrices, setMarketPrices] = useState({});
  const [loading, setLoading] = useState({});
  const [orderForm, setOrderForm] = useState({
    symbol: '',
    type: 'BUY',
    quantity: '',
    price: ''
  });

  const chartData = [
    { time: '09:00', price: 2850 },
    { time: '10:00', price: 2865 },
    { time: '11:00', price: 2842 },
    { time: '12:00', price: 2878 },
    { time: '13:00', price: 2891 },
    { time: '14:00', price: 2873 },
    { time: '15:00', price: 2885 }
  ];

  const fetchBalance = async () => {
    setLoading(prev => ({ ...prev, balance: true }));
    try {
      const response = await fetch(`${API_URL}/api/funds/balance`);
      const data = await response.json();
      setBalance(data.data);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance({ error: error.message });
    } finally {
      setLoading(prev => ({ ...prev, balance: false }));
    }
  };

  const fetchSignal = async () => {
    setLoading(prev => ({ ...prev, signal: true }));
    try {
      const response = await fetch(`${API_URL}/api/signal/entry`);
      const data = await response.json();
      setSignal(data.data);
    } catch (error) {
      console.error('Error fetching signal:', error);
      setSignal({ error: error.message });
    } finally {
      setLoading(prev => ({ ...prev, signal: false }));
    }
  };

  const placeOrder = async () => {
    setLoading(prev => ({ ...prev, order: true }));
    try {
      const response = await fetch(`${API_URL}/api/order/paper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderForm)
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Order placed successfully!');
        setOrderForm({ symbol: '', type: 'BUY', quantity: '', price: '' });
        fetchBalance();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert(`Error placing order: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, order: false }));
    }
  };

  const fetchMarketPrices = async () => {
    try {
      const response = await fetch(`${API_URL}/api/market/prices`);
      const data = await response.json();
      setMarketPrices(data.success ? data.data : {});
    } catch (error) {
      console.error('Error fetching market prices:', error);
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchMarketPrices();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">ALFA Trading Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Paper Trading Mode</span>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={fetchBalance}
              disabled={loading.balance}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
            >
              <span>💰</span>
              <span>{loading.balance ? 'Loading...' : 'Check Funds'}</span>
            </button>
            
            <button
              onClick={fetchSignal}
              disabled={loading.signal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
            >
              <span>📈</span>
              <span>{loading.signal ? 'Loading...' : 'Get Signal'}</span>
            </button>
            
            <button
              onClick={placeOrder}
              disabled={loading.order || !orderForm.symbol || !orderForm.quantity}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
            >
              <span>📊</span>
              <span>{loading.order ? 'Placing...' : 'Place Order'}</span>
            </button>
          </div>

          {/* Balance Display */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Account Balance</h2>
            {balance ? (
              <div className="text-3xl font-bold text-green-600">
                ₹{balance.availableBalance?.toLocaleString()}
              </div>
            ) : (
              <div className="text-gray-500">Loading...</div>
            )}
          </div>

          {/* Trading Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Place Order</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Symbol (e.g., RELIANCE)"
                value={orderForm.symbol}
                onChange={(e) => setOrderForm({...orderForm, symbol: e.target.value.toUpperCase()})}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={orderForm.type}
                onChange={(e) => setOrderForm({...orderForm, type: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
              <input
                type="number"
                placeholder="Quantity"
                value={orderForm.quantity}
                onChange={(e) => setOrderForm({...orderForm, quantity: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Price (optional)"
                value={orderForm.price}
                onChange={(e) => setOrderForm({...orderForm, price: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Price Chart</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="price" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Latest Signal */}
          {signal && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Latest Trading Signal</h2>
              <div className={`p-4 rounded-lg ${signal.signal === 'BUY' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{signal.symbol}</h3>
                    <p className={`text-sm font-medium ${signal.signal === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                      {signal.signal} Signal - {signal.confidence}% Confidence
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{signal.reasoning}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₹{signal.price}</p>
                    <p className="text-sm text-gray-500">Target: ₹{signal.targetPrice}</p>
                    <p className="text-sm text-gray-500">SL: ₹{signal.stopLoss}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Market Prices */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Market Prices</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(marketPrices).map(([symbol, price]) => (
                <div key={symbol} className="bg-gray-50 p-3 rounded text-center">
                  <div className="font-medium">{symbol}</div>
                  <div className="text-lg font-bold text-blue-600">₹{price}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
