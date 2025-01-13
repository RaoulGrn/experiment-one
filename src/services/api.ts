import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthResponse {
  access_token: string;
  user: User;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearSession();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );

    // Initialize from storage
    if (typeof window !== 'undefined') {
      this.initializeFromStorage();
    }
  }

  private initializeFromStorage() {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (token) {
        this.token = token;
      }

      if (userStr) {
        this.user = JSON.parse(userStr);
      }
    } catch (e) {
      this.clearSession();
    }
  }

  private clearSession() {
    this.token = null;
    this.user = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data } = await this.axiosInstance.post<AuthResponse>('/auth/login', {
        email,
        password,
      });

      this.setSession(data);
      return data;
    } catch (error) {
      this.clearSession();
      throw error;
    }
  }

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    try {
      const { data } = await this.axiosInstance.post<AuthResponse>('/auth/register', {
        username,
        email,
        password,
      });

      this.setSession(data);
      return data;
    } catch (error) {
      this.clearSession();
      throw error;
    }
  }

  private setSession(authResult: AuthResponse) {
    this.token = authResult.access_token;
    this.user = authResult.user;

    if (typeof window !== 'undefined') {
      localStorage.setItem('token', this.token);
      localStorage.setItem('user', JSON.stringify(this.user));
    }
  }

  logout() {
    this.clearSession();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

export const auth = new AuthService();
export const game = {
  async getLeaderboard() {
    const { data } = await auth.getAxiosInstance().get('/users/leaderboard');
    return data;
  },

  async getStats() {
    const { data } = await auth.getAxiosInstance().get('/users/stats');
    return data;
  }
};

export default auth.getAxiosInstance(); 