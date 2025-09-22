import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { sendResetLink } from '../services/api';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await sendResetLink(email);
      toast.success('Reset link sent to your email');
      setEmail('');
    } catch (err) {
      toast.error(
        err.response?.data?.error || 'Failed to send reset link. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-gray-800 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-2xl">
        <h2 className="text-2xl font-bold text-red-600 mb-6 text-center">Forgot Password</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg text-white font-semibold transition duration-200 ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;