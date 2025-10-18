'use client';

import { useState, useEffect } from 'react';
import { api, User } from '@/lib/api';

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [newUser, setNewUser] = useState({ name: '', email: '' });
  const [backendStatus, setBackendStatus] = useState<string>('checking...');

  useEffect(() => {
    checkBackendHealth();
    fetchHello();
    fetchUsers();
  }, []);

  const checkBackendHealth = async () => {
    try {
      await api.healthCheck();
      setBackendStatus('connected ✓');
    } catch (error) {
      setBackendStatus('disconnected ✗');
    }
  };

  const fetchHello = async () => {
    try {
      const data = await api.hello();
      setMessage(data.message);
    } catch (error) {
      console.error('Error fetching hello:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser(newUser.name, newUser.email);
      setNewUser({ name: '', email: '' });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              🚀 Monorepo Demo
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Go Backend + Next.js Frontend
            </p>
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
              <span className="text-sm text-gray-600">Backend Status:</span>
              <span className={`text-sm font-semibold ${backendStatus.includes('connected') ? 'text-green-600' : 'text-red-600'}`}>
                {backendStatus}
              </span>
            </div>
          </div>

          {/* Message from Backend */}
          {message && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Message from Backend:
              </h2>
              <p className="text-lg text-indigo-600">{message}</p>
            </div>
          )}

          {/* Create User Form */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Add New User
            </h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Add User
              </button>
            </form>
          </div>

          {/* Users List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Users ({users.length})
            </h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="text-gray-600 mt-2">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No users found</p>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">
                      ID: {user.id}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tech Stack */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 text-sm mb-4">Built with:</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <span className="bg-white px-4 py-2 rounded-lg shadow-sm text-sm font-medium text-gray-700">
                Go 1.21
              </span>
              <span className="bg-white px-4 py-2 rounded-lg shadow-sm text-sm font-medium text-gray-700">
                Next.js 15
              </span>
              <span className="bg-white px-4 py-2 rounded-lg shadow-sm text-sm font-medium text-gray-700">
                React 19
              </span>
              <span className="bg-white px-4 py-2 rounded-lg shadow-sm text-sm font-medium text-gray-700">
                TypeScript
              </span>
              <span className="bg-white px-4 py-2 rounded-lg shadow-sm text-sm font-medium text-gray-700">
                Tailwind CSS
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
