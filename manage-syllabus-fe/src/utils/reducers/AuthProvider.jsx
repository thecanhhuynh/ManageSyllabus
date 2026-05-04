import { useState } from "react";
import { AuthContext } from "../context/AuthContext";

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('authUser');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('authUser', JSON.stringify(userData));
    }

    const logout = () => {
        setUser(null);
        localStorage.removeItem('authUser');
    }

    const updateUser = (newInfo) => {
        const updatedUser = { ...user, ...newInfo };
        setUser(updatedUser);
        localStorage.setItem('user_info', JSON.stringify(updatedUser));
    };
    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    )
}