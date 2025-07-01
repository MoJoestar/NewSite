// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('otaku_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('otaku_user');
      }
    }
    setIsLoading(false);
  }, []);

  // Save user to localStorage whenever user state changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('otaku_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('otaku_user');
    }
  }, [user]);

  const login = async (username, password) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get users from localStorage or create empty array
    const users = JSON.parse(localStorage.getItem('otaku_users') || '[]');
    
    // Find user
    const foundUser = users.find(u => u.username === username && u.password === password);
    
    if (foundUser) {
      const userWithoutPassword = { ...foundUser };
      delete userWithoutPassword.password;
      setUser(userWithoutPassword);
      return { success: true, user: userWithoutPassword };
    }
    
    return { success: false, error: 'Invalid username or password' };
  };

  const register = async (username, password, email) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Validation
    if (username.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }
    
    // Get existing users
    const users = JSON.parse(localStorage.getItem('otaku_users') || '[]');
    
    // Check if user already exists
    if (users.find(u => u.username === username)) {
      return { success: false, error: 'Username already exists' };
    }
    
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Email already registered' };
    }
    
    // Create new user
    const newUser = {
      id: Date.now().toString(),
      username,
      password,
      email,
      favorites: [],
      watchHistory: [],
      createdAt: new Date().toISOString()
    };
    
    // Save to localStorage
    users.push(newUser);
    localStorage.setItem('otaku_users', JSON.stringify(users));
    
    // Set current user (without password)
    const userWithoutPassword = { ...newUser };
    delete userWithoutPassword.password;
    setUser(userWithoutPassword);
    
    return { success: true, user: userWithoutPassword };
  };

  const logout = () => {
    setUser(null);
  };

  const addToFavorites = (item) => {
    if (!user) return false;
    
    const users = JSON.parse(localStorage.getItem('otaku_users') || '[]');
    const userIndex = users.findIndex(u => u.id === user.id);
    
    if (userIndex !== -1) {
      // Check if already in favorites
      const isAlreadyFavorite = users[userIndex].favorites.find(fav => fav.id === item.id);
      if (isAlreadyFavorite) return false;
      
      users[userIndex].favorites.push({
        ...item,
        addedAt: new Date().toISOString()
      });
      
      localStorage.setItem('otaku_users', JSON.stringify(users));
      
      // Update current user state
      setUser(prev => ({
        ...prev,
        favorites: users[userIndex].favorites
      }));
      
      return true;
    }
    return false;
  };

  const removeFromFavorites = (itemId) => {
    if (!user) return false;
    
    const users = JSON.parse(localStorage.getItem('otaku_users') || '[]');
    const userIndex = users.findIndex(u => u.id === user.id);
    
    if (userIndex !== -1) {
      users[userIndex].favorites = users[userIndex].favorites.filter(fav => fav.id !== itemId);
      localStorage.setItem('otaku_users', JSON.stringify(users));
      
      // Update current user state
      setUser(prev => ({
        ...prev,
        favorites: users[userIndex].favorites
      }));
      
      return true;
    }
    return false;
  };

  const addToWatchHistory = (item, episode = null) => {
    if (!user) return false;
    
    const users = JSON.parse(localStorage.getItem('otaku_users') || '[]');
    const userIndex = users.findIndex(u => u.id === user.id);
    
    if (userIndex !== -1) {
      const historyItem = {
        ...item,
        watchedAt: new Date().toISOString(),
        episode: episode
      };
      
      // Remove existing entry if it exists
      users[userIndex].watchHistory = users[userIndex].watchHistory.filter(
        h => !(h.id === item.id && h.episode === episode)
      );
      
      // Add to beginning of array
      users[userIndex].watchHistory.unshift(historyItem);
      
      // Keep only last 50 items
      users[userIndex].watchHistory = users[userIndex].watchHistory.slice(0, 50);
      
      localStorage.setItem('otaku_users', JSON.stringify(users));
      
      // Update current user state
      setUser(prev => ({
        ...prev,
        watchHistory: users[userIndex].watchHistory
      }));
      
      return true;
    }
    return false;
  };

  const isFavorite = (itemId) => {
    if (!user || !user.favorites) return false;
    return user.favorites.some(fav => fav.id === itemId);
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    addToFavorites,
    removeFromFavorites,
    addToWatchHistory,
    isFavorite
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};