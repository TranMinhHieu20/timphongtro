import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import { io } from 'socket.io-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await authService.check();
                setUser(res.data);
                setIsAuthenticated(true);
            } catch (error) {
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    // Socket listener for realtime profile/favorite updates
    useEffect(() => {
        if (user?._id) {
            const socketUrl = import.meta.env.MODE === 'development' ? "http://localhost:3000" : window.location.origin;
            const socket = io(socketUrl, {
                query: { userId: user._id }
            });

            socket.on('favoriteUpdate', (newFavorites) => {
                setUser(prev => prev ? { ...prev, favorites: newFavorites } : null);
            });

            return () => socket.disconnect();
        }
    }, [user?._id]);

    const login = async (credentials) => {
        const res = await authService.login(credentials);
        setUser(res.data.user);
        setIsAuthenticated(true);
        return res;
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    const updateUser = (userData) => {
        setUser(prev => ({ ...prev, ...userData }));
    };

    const value = {
        user,
        isAuthenticated,
        loading,
        isAdmin: user?.role === 'admin',
        login,
        logout,
        updateUser
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
