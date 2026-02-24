import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { EyeIcon, EyeOffIcon } from '../IconComponents';

const AuthCard: React.FC = () => {
    // Mode toggle between Login and Sign Up
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    
    // Form data states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    
    // Visibility toggle states for both password fields
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const navigate = useNavigate();
    const { login, signup, loading, error } = useAuth();

    /**
     * Submission handler with Password matching check
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation: Ensure passwords match before calling the API
        if (mode === 'signup' && password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        
        try {
            if (mode === 'login') {
                await login(email, password);
            } else {
                // Per requirements: All signups default to 'user' role internally
                await signup(email, password, fullName);
            }
        } catch (err: any) {
            console.error("Auth Submission Error:", err);
        }
    };

    return (
        <div className="w-full max-w-md bg-white border border-gray-100 rounded-3xl p-10 shadow-sm">
            {/* Login / Sign Up Toggle Tabs */}
            <div className="flex justify-center gap-12 mb-8 text-lg font-medium">
                <button 
                    type="button" 
                    onClick={() => setMode('login')} 
                    className={`pb-2 px-4 transition-all ${mode === 'login' ? 'text-green-600 border-b-2 border-green-600 font-bold' : 'text-gray-400'}`}
                >
                    Login
                </button>
                <button 
                    type="button" 
                    onClick={() => setMode('signup')} 
                    className={`pb-2 px-4 transition-all ${mode === 'signup' ? 'text-green-600 border-b-2 border-green-600 font-bold' : 'text-gray-400'}`}
                >
                    Sign Up
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name field - Sign Up only */}
                {mode === 'signup' && (
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Full Name</label>
                        <input 
                            type="text" 
                            value={fullName} 
                            onChange={(e) => setFullName(e.target.value)} 
                            required 
                            className="w-full border border-gray-200 p-3 rounded-xl focus:ring-1 focus:ring-green-500 outline-none bg-gray-50/30 transition-all" 
                        />
                    </div>
                )}

                {/* Email field - No placeholder as requested */}
                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Email</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="" 
                        required 
                        className="w-full border border-gray-200 p-3 rounded-xl focus:ring-1 focus:ring-green-500 outline-none bg-gray-50/30 transition-all" 
                    />
                </div>
                
                {/* Main Password field with toggle icon */}
                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Password</label>
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            className="w-full border border-gray-200 p-3 rounded-xl focus:ring-1 focus:ring-green-500 outline-none bg-gray-50/30 transition-all" 
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)} 
                            className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Confirm Password field with toggle icon - Sign Up only */}
                {mode === 'signup' && (
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Confirm Password</label>
                        <div className="relative">
                            <input 
                                type={showConfirmPassword ? "text" : "password"} 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                required 
                                className="w-full border border-gray-200 p-3 rounded-xl focus:ring-1 focus:ring-green-500 outline-none bg-gray-50/30 transition-all" 
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                            >
                                {showConfirmPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                )}

                {/* Main Submit Button */}
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-[#1db954] hover:bg-green-600 text-white py-4 rounded-xl font-bold transition-all shadow-sm mt-2 disabled:opacity-50"
                >
                    {loading ? "Processing..." : (mode === 'login' ? "Login" : "Sign Up")}
                </button>

                {/* OR Separator */}
                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-xs">OR</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                </div>

                {/* Google Sign-in Placeholder */}
                <button 
                    type="button"
                    className="w-full border border-gray-200 py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all font-medium text-gray-600 text-sm"
                >
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                    Sign in with Google
                </button>
            </form>

            {/* Error Message Section */}
            {error && (
                <div className="mt-4 p-2 bg-red-50 border border-red-100 rounded-lg">
                    <p className="text-xs text-red-500 text-center">{error}</p>
                </div>
            )}
        </div>
    );
};

export default AuthCard;