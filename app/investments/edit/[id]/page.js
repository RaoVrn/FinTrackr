'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useAuth } from '../../../context/AuthContext';
import { getInvestmentTypeDisplayName } from '../../../lib/investmentUtils';

export default function EditInvestmentPage() {
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    type: 'stocks',
    category: '',
    sector: '',
    riskLevel: 'moderate',
    tags: '',

    // Purchase Details
    purchaseDate: '',
    investedAmount: '',
    quantity: '',
    pricePerUnit: '',
    fees: '0',
    tickerSymbol: '',
    isin: '',

    // Current Status
    currentValue: '',
    expectedSellDate: '',

    // SIP Support
    isSIP: false,
    sipAmount: '',
    sipStartDate: '',
    sipFrequency: 'monthly',

    // Additional
    notes: '',
    attachmentUrl: ''
  });

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const { getAuthHeaders, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const investmentId = params.id;

  const investmentTypes = [
    { value: 'stocks', label: 'Stocks', description: 'Individual company shares' },
    { value: 'mutual-fund', label: 'Mutual Funds', description: 'Professionally managed investment funds' },
    { value: 'crypto', label: 'Cryptocurrency', description: 'Digital currencies and tokens' },
    { value: 'bonds', label: 'Bonds', description: 'Government and corporate bonds' },
    { value: 'real-estate', label: 'Real Estate', description: 'Property investments and REITs' },
    { value: 'etf', label: 'ETF', description: 'Exchange-traded funds' },
    { value: 'gold', label: 'Gold', description: 'Gold and precious metals' },
    { value: 'ppf', label: 'PPF', description: 'Public Provident Fund' },
    { value: 'nps', label: 'NPS', description: 'National Pension System' },
    { value: 'custom', label: 'Custom', description: 'Other investment types' }
  ];

  const riskLevels = [
    { value: 'low', label: 'Low Risk', color: 'text-green-600', bg: 'bg-green-100' },
    { value: 'moderate', label: 'Moderate Risk', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { value: 'high', label: 'High Risk', color: 'text-red-600', bg: 'bg-red-100' }
  ];

  useEffect(() => {
    if (isAuthenticated && investmentId) {
      fetchInvestment();
    }
  }, [isAuthenticated, investmentId]);

  const fetchInvestment = async () => {
    try {
      setFetchLoading(true);
      const response = await fetch(`/api/investments/${investmentId}`, {
        headers: getAuthHeaders(),
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch investment');
      }

      const investment = await response.json();
      
      // Populate form with existing data
      setFormData({
        name: investment.name || '',
        type: investment.type || 'stocks',
        category: investment.category || '',
        sector: investment.sector || '',
        riskLevel: investment.riskLevel || 'moderate',
        tags: investment.tags ? investment.tags.join(', ') : '',
        purchaseDate: investment.purchaseDate ? new Date(investment.purchaseDate).toISOString().split('T')[0] : '',
        investedAmount: investment.investedAmount?.toString() || '',
        quantity: investment.quantity?.toString() || '',
        pricePerUnit: investment.pricePerUnit?.toString() || '',
        fees: investment.fees?.toString() || '0',
        tickerSymbol: investment.tickerSymbol || '',
        isin: investment.isin || '',
        currentValue: investment.currentValue?.toString() || '',
        expectedSellDate: investment.expectedSellDate ? new Date(investment.expectedSellDate).toISOString().split('T')[0] : '',
        isSIP: investment.isSIP || false,
        sipAmount: investment.sipAmount?.toString() || '',
        sipStartDate: investment.sipStartDate ? new Date(investment.sipStartDate).toISOString().split('T')[0] : '',
        sipFrequency: investment.sipFrequency || 'monthly',
        notes: investment.notes || '',
        attachmentUrl: investment.attachmentUrl || ''
      });

    } catch (error) {
      console.error('Error fetching investment:', error);
      setError('Failed to load investment details');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const calculateTotalInvested = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const pricePerUnit = parseFloat(formData.pricePerUnit) || 0;
    const fees = parseFloat(formData.fees) || 0;
    
    if (quantity > 0 && pricePerUnit > 0) {
      return (quantity * pricePerUnit) + fees;
    }
    return parseFloat(formData.investedAmount) || 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.type || !formData.purchaseDate || 
        !formData.investedAmount || !formData.currentValue) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.isSIP && (!formData.sipAmount || !formData.sipStartDate)) {
      setError('SIP investments require SIP amount and start date');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      // Prepare submission data
      const submitData = {
        ...formData,
        investedAmount: parseFloat(formData.investedAmount),
        currentValue: parseFloat(formData.currentValue),
        quantity: formData.quantity ? parseFloat(formData.quantity) : undefined,
        pricePerUnit: formData.pricePerUnit ? parseFloat(formData.pricePerUnit) : undefined,
        fees: parseFloat(formData.fees) || 0,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        sipAmount: formData.isSIP && formData.sipAmount ? parseFloat(formData.sipAmount) : undefined
      };

      // Remove empty optional fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '' || submitData[key] === undefined) {
          delete submitData[key];
        }
      });

      const response = await fetch(`/api/investments/${investmentId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(submitData)
      });

      if (response.status === 401) {
        setError('Session expired. Please login again.');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update investment');
      }

      // Success - redirect to investments page
      router.push('/investments');
    } catch (error) {
      console.error('Error updating investment:', error);
      setError(error.message || 'Failed to update investment');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  if (fetchLoading) {
    return (
      <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="relative mb-6">
              <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
              <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <div className="space-y-2">
              <p className="text-xl font-semibold text-gray-800">Loading Investment</p>
              <p className="text-gray-600">Fetching investment details...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => router.back()}
                className="p-3 text-gray-600 hover:text-indigo-600 transition-all duration-300 rounded-2xl hover:bg-white/50 backdrop-blur-sm"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Edit Investment</h1>
                <p className="text-gray-600">Update your investment details</p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3, 4, 5].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                    step >= stepNumber 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                      : 'bg-gray-100/70 text-gray-600 backdrop-blur-sm'
                  }`}>
                    {stepNumber}
                  </div>
                  {stepNumber < 5 && (
                    <div className={`w-16 h-2 mx-2 rounded-full transition-all duration-300 ${
                      step > stepNumber ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50/70 backdrop-blur-sm border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-6 shadow-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
              
              {/* Step 1: Basic Details */}
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6">Basic Details</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Investment Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Apple Inc., SBI Bluechip Fund"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Investment Type *
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {investmentTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label} - {type.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <input
                        type="text"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Large Cap, Mid Cap, Equity Fund"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sector
                      </label>
                      <input
                        type="text"
                        name="sector"
                        value={formData.sector}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Technology, Healthcare, Banking"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Risk Level
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {riskLevels.map((level) => (
                          <button
                            key={level.value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, riskLevel: level.value }))}
                            className={`p-3 rounded-xl border-2 font-medium transition-all ${
                              formData.riskLevel === level.value
                                ? `border-blue-500 ${level.bg} ${level.color}`
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {level.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags
                      </label>
                      <input
                        type="text"
                        name="tags"
                        value={formData.tags}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., dividend, growth, long-term (comma separated)"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Purchase Details */}
              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6">Purchase Details</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Purchase Date *
                      </label>
                      <input
                        type="date"
                        name="purchaseDate"
                        value={formData.purchaseDate}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Invested Amount *
                      </label>
                      <input
                        type="number"
                        name="investedAmount"
                        value={formData.investedAmount}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="₹ 10,000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity (Optional)
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        min="0"
                        step="0.001"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="100 shares/units"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price Per Unit (Optional)
                      </label>
                      <input
                        type="number"
                        name="pricePerUnit"
                        value={formData.pricePerUnit}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="₹ 100 per unit"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fees & Charges
                      </label>
                      <input
                        type="number"
                        name="fees"
                        value={formData.fees}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="₹ 0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ticker Symbol / ISIN
                      </label>
                      <input
                        type="text"
                        name={formData.type === 'stocks' || formData.type === 'etf' ? 'tickerSymbol' : 'isin'}
                        value={formData.type === 'stocks' || formData.type === 'etf' ? formData.tickerSymbol : formData.isin}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={formData.type === 'stocks' || formData.type === 'etf' ? "AAPL, RELIANCE" : "INF090I01239"}
                      />
                    </div>
                  </div>

                  {/* Real-time calculation display */}
                  {formData.quantity && formData.pricePerUnit && (
                    <div className="bg-blue-50 p-4 rounded-xl">
                      <p className="text-sm text-blue-800">
                        <strong>Calculated Total Investment:</strong> ₹{calculateTotalInvested().toLocaleString()}
                        <br />
                        <span className="text-xs">({formData.quantity} × ₹{formData.pricePerUnit} + ₹{formData.fees || 0} fees)</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Current Status */}
              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6">Current Status</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Value *
                      </label>
                      <input
                        type="number"
                        name="currentValue"
                        value={formData.currentValue}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="₹ 12,000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expected Sell Date (Optional)
                      </label>
                      <input
                        type="date"
                        name="expectedSellDate"
                        value={formData.expectedSellDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* P&L Preview */}
                  {formData.investedAmount && formData.currentValue && (
                    <div className="bg-gray-50 p-6 rounded-xl">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Investment Preview</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Invested Amount</p>
                          <p className="text-lg font-semibold text-blue-600">
                            ₹{parseFloat(formData.investedAmount).toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Current Value</p>
                          <p className="text-lg font-semibold text-green-600">
                            ₹{parseFloat(formData.currentValue).toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm text-gray-600">P&L</p>
                          {(() => {
                            const pnl = parseFloat(formData.currentValue) - parseFloat(formData.investedAmount);
                            const pnlPercent = (pnl / parseFloat(formData.investedAmount)) * 100;
                            return (
                              <p className={`text-lg font-semibold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {pnl >= 0 ? '+' : ''}₹{Math.abs(pnl).toLocaleString()}
                                <br />
                                <span className="text-sm">
                                  ({pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                                </span>
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: SIP Support */}
              {step === 4 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6">SIP Configuration</h2>
                  
                  <div className="flex items-center space-x-3 mb-6">
                    <input
                      type="checkbox"
                      id="isSIP"
                      name="isSIP"
                      checked={formData.isSIP}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isSIP" className="text-lg font-medium text-gray-700">
                      This is a SIP (Systematic Investment Plan)
                    </label>
                  </div>

                  {formData.isSIP && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-blue-50 rounded-xl">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SIP Amount *
                        </label>
                        <input
                          type="number"
                          name="sipAmount"
                          value={formData.sipAmount}
                          onChange={handleInputChange}
                          required={formData.isSIP}
                          min="0"
                          step="0.01"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="₹ 5,000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SIP Start Date *
                        </label>
                        <input
                          type="date"
                          name="sipStartDate"
                          value={formData.sipStartDate}
                          onChange={handleInputChange}
                          required={formData.isSIP}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SIP Frequency *
                        </label>
                        <select
                          name="sipFrequency"
                          value={formData.sipFrequency}
                          onChange={handleInputChange}
                          required={formData.isSIP}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="weekly">Weekly</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {!formData.isSIP && (
                    <div className="bg-gray-50 p-6 rounded-xl text-center">
                      <p className="text-gray-600">
                        SIP configuration is optional. You can enable it if this is a systematic investment plan.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Additional Information */}
              {step === 5 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6">Additional Information</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes / Description
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Any additional notes about this investment..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Attachment URL (Optional)
                      </label>
                      <input
                        type="url"
                        name="attachmentUrl"
                        value={formData.attachmentUrl}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://example.com/document.pdf"
                      />
                    </div>
                  </div>

                  {/* Final Summary */}
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Investment Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><strong>Name:</strong> {formData.name}</div>
                      <div><strong>Type:</strong> {getInvestmentTypeDisplayName(formData.type)}</div>
                      <div><strong>Invested Amount:</strong> ₹{parseFloat(formData.investedAmount || 0).toLocaleString()}</div>
                      <div><strong>Current Value:</strong> ₹{parseFloat(formData.currentValue || 0).toLocaleString()}</div>
                      <div><strong>Risk Level:</strong> {formData.riskLevel}</div>
                      <div><strong>SIP:</strong> {formData.isSIP ? `Yes (₹${formData.sipAmount} ${formData.sipFrequency})` : 'No'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-8 border-t border-gray-200">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={step === 1}
                  className="px-6 py-3 text-gray-600 border-0 bg-gray-100/70 rounded-xl hover:bg-white hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium"
                >
                  Previous
                </button>

                {step < 5 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-3 rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {loading ? 'Updating...' : 'Update Investment'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}