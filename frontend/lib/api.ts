const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface RefundHistory {
  stage: string;
  timestamp: string;
}

export interface RefundStatus {
  return_id: string;
  status: string;
  eta_date: string;
  confidence: number;
  history: RefundHistory[];
}

export const api = {
  // Health check
  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) throw new Error('Health check failed');
    return response.json();
  },

  // Hello endpoint
  async hello() {
    const response = await fetch(`${API_BASE_URL}/hello`);
    if (!response.ok) throw new Error('Failed to fetch hello');
    return response.json();
  },

  // Get all users
  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  // Create a new user
  async createUser(name: string, email: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email }),
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  },

  // Get refund status
  async getRefundStatus(returnId: string): Promise<RefundStatus> {
    const response = await fetch(`${API_BASE_URL}/v1/status/${returnId}`);
    if (!response.ok) throw new Error('Failed to fetch refund status');
    return response.json();
  },

  // Get refund explanation (SSE stream)
  async explainRefund(returnId: string, question: string): Promise<ReadableStream> {
    const response = await fetch(`${API_BASE_URL}/v1/status/explain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ return_id: returnId, question }),
    });
    if (!response.ok) throw new Error('Failed to get explanation');
    if (!response.body) throw new Error('No response body');
    return response.body;
  },
};
