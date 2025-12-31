import React, { useState } from 'react';
import { User, Lock, Sun, Moon, Laptop, ArrowRight, LogOut, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useFirebase } from '../hooks/useFirebase';
import { Settings } from '../types';

interface LoginPageProps {
    theme: string;
    toggleTheme: (theme: 'light' | 'dark' | 'system') => void;
    settings: Settings;
}

const LoginPage: React.FC<LoginPageProps> = ({ theme, toggleTheme, settings }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, logout, firebaseUser, currentUser } = useFirebase();

    // Check if user is authenticated via Firebase but NOT in our local user list
    const isUnassigned = firebaseUser && !currentUser;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password);
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        setError('');
        setUsername('');
        setPassword('');
    };

    const getThemeIcon = () => {
        if (theme === 'light') return <Sun className="h-5 w-5" />;
        if (theme === 'dark') return <Moon className="h-5 w-5" />;
        return <Laptop className="h-5 w-5" />;
    };

    const nextThemeMap: Record<string, 'light' | 'dark' | 'system'> = {
        'light': 'dark',
        'dark': 'system',
        'system': 'light'
    };

    const handleThemeToggle = () => {
        toggleTheme(nextThemeMap[theme] || 'system');
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 font-sans overflow-hidden transition-colors duration-500 bg-amazio-light-bg dark:bg-amazio-bg selection:bg-amazio-accent selection:text-amazio-bg">
            
            {/* Ambient Background Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-amazio-secondary/10 dark:bg-amazio-secondary/20 rounded-full blur-[120px] pointer-events-none mix-blend-multiply dark:mix-blend-screen animate-pulse duration-[8000ms]"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-amazio-accent/20 dark:bg-amazio-accent/10 rounded-full blur-[120px] pointer-events-none mix-blend-multiply dark:mix-blend-screen animate-pulse duration-[10000ms]"></div>

            {/* Theme Toggle */}
            <button
                onClick={handleThemeToggle}
                className="absolute top-6 right-6 p-3 rounded-full bg-white/40 dark:bg-white/5 border border-amazio-primary/10 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-amazio-primary dark:hover:text-white backdrop-blur-md shadow-glass-light dark:shadow-glass transition-all hover:scale-105 active:scale-95 z-20 group"
                aria-label="Toggle theme"
            >
                <div className="group-hover:rotate-90 transition-transform duration-500">
                    {getThemeIcon()}
                </div>
            </button>

            {/* Main Card */}
            <div className="relative w-full max-w-md p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#F4EEDF]/95 via-[#F4EEDF]/90 to-[#E6E0D0]/95 backdrop-blur-xl border border-white/40 shadow-2xl animate-in fade-in zoom-in-95 duration-700 z-10">
                
                {/* Header / Logo */}
                <div className="text-center mb-8 pt-2">
                    {/* Event Typography (Replaces Icon & App Name) */}
                    <div className="flex justify-center items-center min-h-[160px]">
                        {settings.branding?.typographyUrl ? (
                            <img 
                                src={settings.branding.typographyUrl} 
                                alt={settings.heading} 
                                className="w-full max-w-[400px] sm:max-w-[480px] h-auto max-h-72 object-contain filter drop-shadow-xl hover:scale-105 transition-all duration-700" 
                            />
                        ) : (
                            <div className="relative">
                                <h1 className="relative text-4xl sm:text-5xl font-black font-serif text-center leading-tight text-amazio-primary tracking-tighter drop-shadow-sm uppercase">
                                    {settings.heading || 'AMAZIO 2026'}
                                </h1>
                            </div>
                        )}
                    </div>
                </div>

                {isUnassigned ? (
                    <div className="p-5 rounded-2xl bg-white/60 border border-white/40 text-center animate-in fade-in zoom-in">
                        <div className="flex justify-center mb-2">
                            <div className="p-2 bg-amber-100/50 rounded-full text-amber-800">
                                <AlertCircle size={24} />
                            </div>
                        </div>
                        <h3 className="font-bold text-lg text-zinc-800 mb-1">Access Pending</h3>
                        <p className="text-sm text-zinc-700 leading-relaxed mb-4">
                            You are authenticated as <br/><strong className="font-mono bg-white/50 px-1 rounded">{firebaseUser?.email}</strong>
                            <br/>but this user has not been assigned a role for Amazio 2026 yet.
                        </p>
                        <p className="text-xs text-zinc-600 mb-4 px-2">
                            Please ask an Administrator to add the username <strong>"{firebaseUser?.email?.split('@')[0]}"</strong> in General Settings {'>'} Users.
                        </p>
                        <button 
                            onClick={handleLogout}
                            className="w-full py-3 bg-white text-zinc-700 rounded-xl font-bold text-sm hover:bg-zinc-50 border border-zinc-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <LogOut size={16} /> Sign Out
                        </button>
                    </div>
                ) : (
                    /* Login Form */
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            {/* Username Input */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-zinc-500 group-focus-within:text-amazio-primary transition-colors" />
                                </div>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    autoComplete="username"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/80 border border-white/50 text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amazio-primary/20 focus:border-transparent transition-all backdrop-blur-sm"
                                    placeholder="Username"
                                />
                            </div>

                            {/* Password Input */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-zinc-500 group-focus-within:text-amazio-primary transition-colors" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-12 py-3.5 rounded-2xl bg-white/80 border border-white/50 text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amazio-primary/20 focus:border-transparent transition-all backdrop-blur-sm"
                                    placeholder="Password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-amazio-primary transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        
                        {/* Remember Me */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-zinc-400 bg-white/40 checked:bg-amazio-primary checked:border-transparent transition-all"
                                    />
                                    <svg
                                        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                                        viewBox="0 0 14 14"
                                        fill="none"
                                    >
                                        <path
                                            d="M3 8L6 11L11 3.5"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                                <span className="ml-3 text-sm text-zinc-700 font-medium group-hover:text-amazio-primary transition-colors">
                                    Keep me signed in
                                </span>
                            </label>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center animate-in fade-in slide-in-from-top-1">
                                <p className="text-sm font-bold text-red-700">{error}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex items-center justify-center gap-2 py-4 px-4 border border-transparent text-sm font-bold uppercase tracking-wider rounded-xl text-white bg-amazio-primary shadow-lg hover:bg-amazio-primary/90 transform hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    <span>Enter Console</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* Footer Watermark */}
                <div className="mt-8 text-center">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold opacity-70">
                        Amazio 2026 Edition • Secure System
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;