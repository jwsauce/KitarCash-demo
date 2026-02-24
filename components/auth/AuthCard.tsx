import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { EyeIcon, EyeOffIcon, GoogleIcon } from '../IconComponents';

const AuthCard: React.FC = () => {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { login, signup, loading, error } = useAuth();

    const redirectByRole = async (uid: string) => {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
            const role = userDoc.data().role;
            if (role === 'driver') navigate('/driver-dashboard');
            else if (role === 'recycling_center') navigate('/center-dashboard');
            else navigate('/dashboard');
        } else {
            navigate('/dashboard');
        }
    };

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            // 这里现在能正确拿到 user 对象了
            const result = await login(email, password);
            if (result?.user) {
                await redirectByRole(result.user.uid);
            }
        } catch (err) {
            console.error("Login Error:", err);
        }
    };

    return (
        <div className="w-full max-w-md bg-white/60 backdrop-blur-xl border border-gray-200/80 rounded-2xl p-8 shadow-lg">
            <div className="flex border-b mb-6 text-center">
                <button onClick={() => setMode('login')} className={`flex-1 pb-2 ${mode === 'login' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-400'}`}>Login</button>
                <button onClick={() => setMode('signup')} className={`flex-1 pb-2 ${mode === 'signup' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-400'}`}>Sign Up</button>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
                <input type="email" name="email" placeholder="Email" required className="w-full border p-2 rounded-lg" />
                <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" required className="w-full border p-2 rounded-lg" />
                <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold">
                    {loading ? "Loading..." : "Login"}
                </button>
            </form>
        </div>
    );
};
export default AuthCard;
