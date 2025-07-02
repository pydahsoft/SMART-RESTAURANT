import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const WaiterLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    phoneNumber: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/waiters/login', formData);
      localStorage.setItem('waiterToken', response.data.token);
      localStorage.setItem('waiterInfo', JSON.stringify(response.data.waiter));
      navigate('/waiter-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md transform transition-all duration-300 hover:scale-[1.01]">
        {/* Card Container */}
        <div className="bg-[#ffffea] rounded-2xl shadow-xl overflow-hidden relative hover:shadow-2xl transition-shadow duration-300">
          {/* Card Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#ff7900]/5 to-[#ff7900]/5 z-0"></div>
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#e0e7ff_1px,transparent_1px)] [background-size:16px_16px] z-0"></div>

          {/* Content */}
          <div className="relative z-10">
            {/* Header */}
            <div className="px-8 pt-8 pb-6">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#ff7900] to-[#e56a00] p-1 transform hover:rotate-[360deg] transition-transform duration-1000">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  <svg className="w-12 h-12 text-[#ff7900]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
                Welcome Back
              </h1>
              <p className="text-center text-gray-600">
                Sign in to your waiter account
              </p>
            </div>

            {/* Form Section */}
            <div className="px-8 pb-8">
              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 transform hover:-translate-y-1 transition-transform duration-300">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Phone Number Input */}
                <div className="group">
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-[#ff7900] transition-colors">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400 group-hover:text-[#ff7900] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      required
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff7900] focus:border-[#ff7900] transition-all duration-200 text-gray-900 placeholder-gray-400 bg-white group-hover:border-[#ff7900] shadow-sm hover:shadow-md"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="group">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-[#ff7900] transition-colors">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400 group-hover:text-[#ff7900] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff7900] focus:border-[#ff7900] transition-all duration-200 text-gray-900 placeholder-gray-400 bg-white group-hover:border-[#ff7900] shadow-sm hover:shadow-md"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center transition-opacity hover:opacity-75"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5 text-gray-400 hover:text-[#ff7900] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-400 hover:text-[#ff7900] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg text-white text-sm font-semibold bg-gradient-to-r from-[#ff7900] to-[#e56a00] hover:from-[#ff7900] hover:to-[#e56a00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff7900] transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl ${
                    isLoading ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-600 hover:text-[#ff7900] transition-colors">
          Need help? Contact your administrator
        </p>
      </div>
    </div>
  );
};

export default WaiterLogin;