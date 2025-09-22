import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { fetchUserProfile, updateUserProfile } from '../services/api';
import toast from 'react-hot-toast';

function EditProfile() {
useContext(AuthContext);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    mobile: '',
    password: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetchUserProfile();
        const data = res?.data || {};
        setProfile({
          name: data.name || '',
          email: data.email || '',
          mobile: data.mobile || '',
          password: ''
        });
      } catch (err) {
        console.error('Profile fetch error:', err.response?.data || err.message);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const payload = {
    name: profile.name.trim(),
    email: profile.email.trim(),
    mobile: profile.mobile.trim()
  };

  if (profile.password?.trim()) {
    const valid = /^(?=.*[A-Za-z])(?=.*\d).+$/.test(profile.password.trim());
    if (!valid) {
      toast.error('Password must contain letters and numbers');
      return;
    }
    payload.password = profile.password.trim();
  }

  try {
  const response = await updateUserProfile(payload);
  console.log('Update response:', response.data); // ✅ Confirmed
  toast.success(response.data.message || 'Profile updated successfully'); // ✅ Use backend message
  setProfile(prev => ({ ...prev, password: '' }));
} catch (err) {
  console.error('Profile update error:', err.response?.data || err.message);
  toast.error(err.response?.data?.error || 'Failed to update profile');
}

};

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading profile...</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4 text-indigo-700">Edit Profile</h2>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <input
          type="text"
          name="name"
          value={profile.name}
          onChange={handleChange}
          placeholder="Name"
          className="p-3 border rounded bg-white text-black"
          required
        />
        <input
          type="email"
          name="email"
          value={profile.email}
          onChange={handleChange}
          placeholder="Email"
          className="p-3 border rounded bg-white text-black"
          required
        />
        <input
          type="text"
          name="mobile"
          value={profile.mobile}
          onChange={handleChange}
          placeholder="Mobile Number"
          className="p-3 border rounded bg-white text-black"
        />
        <input
  type="password"
  name="password"
  value={profile.password}
  onChange={handleChange}
  placeholder="New Password (optional)"
  className="p-3 border rounded bg-white text-black"
  autoComplete="current-password"
/>

        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}

export default EditProfile;
