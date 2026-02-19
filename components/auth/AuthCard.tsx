
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { EyeIcon, EyeOffIcon, GoogleIcon } from '../IconComponents';

type AuthMode = 'login' | 'signup';

const AuthCard: React.FC = () => {
    const [mode, setMode] = useState<AuthMode>('login');
    const [showPassword, setShowPassword] = useState(false);
    
    const { login, signup, loading, error } = useAuth();

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        try {
            await login(email, password);
        } catch (err) {
            console.error(err);
        }
    };
    
    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const fullName = formData.get('fullName') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirmPassword') as string;
        
        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }
        await signup(fullName, email, password);
    };

    return (
        <div className="w-full max-w-md bg-white/60 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-lg p-8">
            <div className="flex border-b border-gray-300 mb-6">
                <button 
                    onClick={() => setMode('login')}
                    className={`flex-1 py-2 font-semibold transition-colors ${mode === 'login' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`}>
                    Login
                </button>
                <button 
                    onClick={() => setMode('signup')}
                    className={`flex-1 py-2 font-semibold transition-colors ${mode === 'signup' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`}>
                    Sign Up
                </button>
            </div>
            
            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
            
            {mode === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" name="email" required className="w-full mt-1 bg-white/80 border border-gray-300 p-2 rounded-md focus:ring-green-500 focus:border-green-500"/>
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input type={showPassword ? 'text' : 'password'} name="password" required className="w-full mt-1 bg-white/80 border border-gray-300 p-2 rounded-md focus:ring-green-500 focus:border-green-500"/>
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 top-6 px-3 flex items-center text-gray-500">
                           {showPassword ? <EyeOffIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                        </button>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-md font-bold hover:bg-green-700 transition disabled:bg-gray-400">
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleSignup} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input type="text" name="fullName" required className="w-full mt-1 bg-white/80 border border-gray-300 p-2 rounded-md focus:ring-green-500 focus:border-green-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" name="email" required className="w-full mt-1 bg-white/80 border border-gray-300 p-2 rounded-md focus:ring-green-500 focus:border-green-500"/>
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input type={showPassword ? 'text' : 'password'} name="password" required className="w-full mt-1 bg-white/80 border border-gray-300 p-2 rounded-md focus:ring-green-500 focus:border-green-500"/>
                         <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 top-6 px-3 flex items-center text-gray-500">
                           {showPassword ? <EyeOffIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                        </button>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                        <input type="password" name="confirmPassword" required className="w-full mt-1 bg-white/80 border border-gray-300 p-2 rounded-md focus:ring-green-500 focus:border-green-500"/>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-md font-bold hover:bg-green-700 transition disabled:bg-gray-400">
                         {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>
            )}
            
            <div className="flex items-center my-6">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 text-gray-500 text-sm">OR</span>
                <div className="flex-grow border-t border-gray-300"></div>
            </div>
            
            <button className="w-full flex items-center justify-center space-x-2 bg-white border border-gray-300 py-3 rounded-md hover:bg-gray-100 transition">
                <GoogleIcon className="w-5 h-5 text-red-500"/>
                <span className="font-semibold text-gray-700">Sign in with Google</span>
            </button>
        </div>
    );
};

export default AuthCard;
