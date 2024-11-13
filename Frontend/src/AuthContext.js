import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (formData) => {
    try {
      const response = await axios.post('http://localhost:5000/login', formData);
      const loggedInUser = { 
        name: response.data.name, // Capture the user's name from the response
        email: formData.email 
      };
      
      // Save user info in local storage for persistence
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      setUser(loggedInUser); // Update the state with the user info
    } catch (error) {
      throw error;
    }
  };
  

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
