import React, { useState } from 'react';
import axios from 'axios';

export default function CreateUserForm() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [form, setForm] = useState({
    Uname: '',
    roleid: '',
    password: '',
    confpassword: '',
    pwdexpdate: getDefaultExpiryDate(),
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setMessage('');
    if (form.password !== form.confpassword) {
      setErrors(['Passwords do not match']);
      return;
    }
    try {
      const res = await axios.post(`${apiUrl}/api/create-account`, form);
      setMessage(res.data.message || 'Account created!');
    } catch (err: any) {
      setErrors([err.response?.data?.error || 'Error creating account']);
    }
  };

  function getDefaultExpiryDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 10);
  return date.toISOString().slice(0, 10);
}

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6 border border-gray-300 dark:border-gray-600 rounded-lg">
      <div className="text-center border-b border-gray-300 dark:border-gray-600 pb-4">
        <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-300">
          Create User Account
        </h1>
      </div>
      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          {errors.map((err, idx) => (
            <p key={idx} className="text-red-700 dark:text-red-300">• {err}</p>
          ))}
        </div>
      )}
      {message && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-green-700 dark:text-green-300">
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="font-semibold mb-1 text-sm text-gray-700 dark:text-gray-300">Username</label>
            <input name="Uname" value={form.Uname} onChange={handleChange} required className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div className="flex flex-col">
            <label className="font-semibold mb-1 text-sm text-gray-700 dark:text-gray-300">Role</label>
            <input name="roleid" value={form.roleid} onChange={handleChange} required className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="font-semibold mb-1 text-sm text-gray-700 dark:text-gray-300">Password</label>
            <input name="password" value={form.password} onChange={handleChange} type="password" required className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div className="flex flex-col">
            <label className="font-semibold mb-1 text-sm text-gray-700 dark:text-gray-300">Confirm Password</label>
            <input name="confpassword" value={form.confpassword} onChange={handleChange} type="password" required className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div className="flex flex-col">
            <label className="font-semibold mb-1 text-sm text-gray-700 dark:text-gray-300">Password Expiry</label>
            <input name="pwdexpdate" value={form.pwdexpdate} onChange={handleChange} type="date" required className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" disabled />
          </div>
        </div>
        <div className="flex justify-center">
          <button type="submit" className="px-6 py-2 bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg transition-colors">
            Create Account
          </button>
        </div>
      </form>
    </div>
  );
}