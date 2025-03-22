import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";

// User interface
interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
}

// Auth context interface
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    company?: string
  ) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  clearError: () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in on component mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setLoading(false);
          return;
        }

        // Set auth token header
        setAuthToken(token);

        // Get user data
        const res = await axios.get("/api/users/profile");

        setUser(res.data.user);
        setIsAuthenticated(true);
      } catch (err) {
        // Clear invalid token
        localStorage.removeItem("token");
        setAuthToken(null);
        setError("Session expired. Please login again.");
      } finally {
        setLoading(false);
      }
    };

    // Create an AbortController to cancel pending requests
    const controller = new AbortController();

    // Modify axios instance to use this signal
    const originalGet = axios.get;
    axios.get = (url: string, config = {}) => {
      return originalGet(url, {
        ...config,
        signal: controller.signal,
      });
    };

    checkLoggedIn();

    // Clean up function
    return () => {
      // Abort any in-flight requests when component unmounts
      controller.abort();

      // Restore original axios.get
      axios.get = originalGet;
    };
  }, []);

  // Set auth token for axios
  const setAuthToken = (token: string | null) => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.post(`${config.apiUrl}/users/login`, {
        email,
        password,
      });
      // Store token in localStorage
      localStorage.setItem("token", res.data.token);

      // Set auth token in headers
      setAuthToken(res.data.token);

      // Set user data and auth state
      setUser(res.data.user);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (
    name: string,
    email: string,
    password: string,
    company?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.post("/api/users/register", {
        name,
        email,
        password,
        company,
      });

      // Store token in localStorage
      localStorage.setItem("token", res.data.token);

      // Set auth token in headers
      setAuthToken(res.data.token);

      // Set user data and auth state
      setUser(res.data.user);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem("token");

    // Remove auth token from headers
    setAuthToken(null);

    // Reset state
    setIsAuthenticated(false);
    setUser(null);
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
