import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { EyeIcon, EyeOffIcon } from '../IconComponents';

const AuthCard: React.FC = () => {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [isDriver, setIsDriver] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();
    const { login, signup, loading, error } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            if (mode === 'login') {
                await login(email, password);
            } else {
                // FIXED: Passing all 4 required arguments in the correct order
                // (email, password, fullName, role)
                await signup(email, password, fullName, isDriver ? 'driver' : 'user');
            }
        } catch (err: any) {
            console.error("AuthCard Submission Error:", err);
        }
    };

    return (
        <div className="w-full max-w-md bg-white/60 backdrop-blur-xl border border-gray-200/80 rounded-2xl p-8 shadow-lg">
            <div className="flex border-b mb-6">
                <button type="button" onClick={() => setMode('login')} className={`flex-1 pb-2 ${mode === 'login' ? 'text-green-600 border-b-2 border-green-600 font-bold' : 'text-gray-400'}`}>Login</button>
                <button type="button" onClick={() => setMode('signup')} className={`flex-1 pb-2 ${mode === 'signup' ? 'text-green-600 border-b-2 border-green-600 font-bold' : 'text-gray-400'}`}>Sign Up</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" required className="w-full border p-2 rounded-lg" />
                )}
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full border p-2 rounded-lg" />
                
                <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 6 chars)" required className="w-full border p-2 rounded-lg" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400">
                        {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                </div>

                {mode === 'signup' && (
                    <label className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg cursor-pointer">
                        <input type="checkbox" checked={isDriver} onChange={(e) => setIsDriver(e.target.checked)} className="w-4 h-4 accent-green-600" />
                        <span className="text-sm font-medium text-gray-700 font-bold">Apply as KitarCash Driver</span>
                    </label>
                )}

                <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold">
                    {loading ? "Processing..." : (mode === 'login' ? "Login" : "Create Account")}
                </button>
            </form>
            {error && <p className="mt-4 text-sm text-red-500 text-center bg-red-50 p-2 rounded-lg">{error}</p>}
        </div>
    );
};

export default AuthCard;