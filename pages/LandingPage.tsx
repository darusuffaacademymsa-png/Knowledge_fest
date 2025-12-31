import React, { useState, useEffect } from 'react';
import { 
    Sparkles, ArrowRight, Trophy, Palette, 
    Monitor, Users, ChevronDown, Lock, User, 
    Sun, Moon, Laptop, Eye, EyeOff, LogOut, AlertCircle,
    Flag, Layers, Calendar, Gavel, BookOpen, Trees, TreePine, Leaf,
    CheckCircle2, Star, Shapes, Lightbulb, Mic
} from 'lucide-react';
import { useFirebase } from '../hooks/useFirebase';
import { Settings, ItemType } from '../types';

interface LandingPageProps {
    theme: string;
    toggleTheme: (theme: 'light' | 'dark' | 'system') => void;
    settings: Settings;
}

const FeatureCard = ({ icon: Icon, title, description, color }: { icon: any, title: string, description: string, color: string }) => (
    <div className="group relative p-10 rounded-[3.5rem] bg-white/60 dark:bg-[#1A2312] border border-[#283618]/10 dark:border-white/5 hover:border-[#9AAD59]/50 transition-all duration-500 hover:-translate-y-2 backdrop-blur-md shadow-xl dark:shadow-none overflow-hidden">
        <div className={`absolute -right-4 -top-4 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${color}`}></div>
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-lg ${color} text-white`}>
            <Icon size={32} strokeWidth={1.5} />
        </div>
        <h3 className="text-2xl font-black font-slab text-[#283618] dark:text-white mb-4 uppercase tracking-tight">{title}</h3>
        <p className="text-[#606C38] dark:text-[#9AAD59] text-sm leading-relaxed font-normal">{description}</p>
    </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ theme, toggleTheme, settings }) => {
    const { login, logout, firebaseUser, currentUser, state } = useFirebase();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isUnassigned = firebaseUser && !currentUser;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password, true);
        } catch (err: any) {
            setError('Authentication failed. Check handle and access key.');
        } finally {
            setLoading(false);
        }
    };

    const getThemeIcon = () => {
        if (theme === 'light') return <Sun size={18} />;
        if (theme === 'dark') return <Moon size={18} />;
        return <Laptop size={18} />;
    };

    return (
        <div className="min-h-screen bg-[#F1F5DC] dark:bg-[#0F1210] text-[#283618] dark:text-white selection:bg-[#9AAD59] selection:text-[#283618] overflow-x-hidden font-slab transition-colors duration-1000">
            
            {/* Style Guide Patterns Overlay */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-[0.04] dark:opacity-[0.07]">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
                {/* Simulated Wavy Lines Pattern (Page 11) */}
                <div className="absolute top-0 w-full h-32 border-b-2 border-[#283618] opacity-20"></div>
                <div className="absolute top-4 w-full h-32 border-b-2 border-[#283618] opacity-20"></div>
                <div className="absolute bottom-0 w-full h-32 border-t-2 border-[#283618] opacity-20"></div>
                <div className="absolute bottom-4 w-full h-32 border-t-2 border-[#283618] opacity-20"></div>
            </div>

            {/* Ambient Lighting */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-[#283618]/10 dark:bg-[#283618]/30 rounded-full blur-[160px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-[#9AAD59]/20 dark:bg-[#9AAD59]/10 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '3s' }}></div>
            </div>

            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 ${scrolled ? 'bg-[#F1F5DC]/90 dark:bg-[#0F1210]/90 backdrop-blur-2xl border-b border-[#283618]/5 dark:border-white/5 py-4' : 'bg-transparent py-10'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        {settings.branding?.typographyUrl ? (
                            <img src={settings.branding.typographyUrl} alt="AMAZIO" className="h-10 w-auto object-contain transition-all" />
                        ) : (
                            <>
                                <div className="w-12 h-12 rounded-2xl bg-[#283618] flex items-center justify-center font-slab text-2xl font-black shadow-2xl text-white transform rotate-3">A</div>
                                <span className="text-3xl font-black tracking-tighter uppercase hidden sm:block text-[#283618] dark:text-white">
                                    AMAZIO <span className="text-[#9AAD59] block text-[10px] tracking-[0.6em] mt-1 font-bold">THE ROOTED TREE</span>
                                </span>
                            </>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-4 sm:gap-8">
                        <button 
                            onClick={() => toggleTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="p-3 rounded-full hover:bg-[#283618]/5 dark:hover:bg-white/5 text-[#606C38] dark:text-zinc-400 hover:text-[#283618] dark:hover:text-white transition-all"
                        >
                            {getThemeIcon()}
                        </button>
                        <a href="#portal" className="px-8 py-3 bg-[#283618] dark:bg-white text-white dark:text-[#283618] rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-[#283618]/30 dark:shadow-white/10">
                            Access Portal
                        </a>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 pt-60 pb-32 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-flex flex-col items-center animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="inline-flex items-center gap-3 px-6 py-2 bg-[#283618]/5 dark:bg-[#9AAD59]/10 rounded-full border border-[#283618]/10 dark:border-[#9AAD59]/20 mb-6">
                            <TreePine size={18} className="text-[#283618] dark:text-[#9AAD59]" />
                            <span className="text-[12px] font-black uppercase tracking-[0.5em] text-[#283618] dark:text-[#9AAD59]">The Authentic Path</span>
                        </div>
                        
                        {/* New Primary Title */}
                        <h2 className="text-2xl md:text-4xl font-light font-slab text-[#606C38] dark:text-[#9AAD59] uppercase tracking-[0.3em] mb-4">
                            The Rooted Tree
                        </h2>

                        {/* Brand Typography / Name */}
                        <div className="relative mb-6">
                            {settings.branding?.typographyUrl ? (
                                <img 
                                    src={settings.branding.typographyUrl} 
                                    alt="AMAZIO" 
                                    className="h-auto max-h-48 md:max-h-64 lg:max-h-72 w-auto object-contain filter drop-shadow-2xl hover:scale-[1.02] transition-all duration-700 select-none" 
                                />
                            ) : (
                                <h1 className="text-7xl md:text-9xl font-black leading-none tracking-tighter uppercase text-[#283618] dark:text-white drop-shadow-xl select-none">
                                    AMAZIO
                                </h1>
                            )}
                        </div>

                        {/* Specific 2026 Edition Badge */}
                        <div className="inline-block px-8 py-3 bg-[#9AAD59] text-[#283618] rounded-full text-sm font-black uppercase tracking-[0.4em] shadow-lg mb-12 animate-in zoom-in-95 duration-1000 delay-500">
                            2026 Edition
                        </div>
                    </div>
                    
                    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                        <p className="text-[#283618] dark:text-[#9AAD59] text-xl md:text-3xl font-bold italic tracking-tight leading-snug">
                            "Where Knowledge and Art Amaze"
                        </p>
                        <p className="text-[#606C38] dark:text-[#9AAD59] text-base md:text-lg font-normal max-w-2xl mx-auto leading-relaxed opacity-80">
                            Nourished by prophetic wisdom, reaching towards excellence. A modern management ecosystem designed to orchestrate talent and intelligence.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-6 mt-16 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
                        <a href="#portal" className="px-10 py-5 bg-[#283618] dark:bg-[#9AAD59] text-white dark:text-[#283618] rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs flex items-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-[#283618]/40 dark:shadow-[#9AAD59]/30">
                            Enter Console <ArrowRight size={20} />
                        </a>
                        <a href="#ecosystem" className="px-10 py-5 bg-white/40 dark:bg-white/5 border border-[#283618]/20 dark:border-white/10 text-[#283618] dark:text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs hover:bg-white dark:hover:bg-white/10 transition-all backdrop-blur-xl">
                            The Ecosystem
                        </a>
                    </div>
                </div>
            </section>

            {/* Ecosystem Information Grid */}
            <section id="ecosystem" className="relative z-10 max-w-7xl mx-auto px-6 py-32 border-t border-[#283618]/5 dark:border-white/5">
                <div className="text-center mb-24">
                    <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 text-[#283618] dark:text-white">The Anatomy</h2>
                    <p className="text-[#606C38] dark:text-[#9AAD59] font-bold text-lg uppercase tracking-widest opacity-60 italic">Integrated Units of the Rooted Tree</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Teams / Units Info */}
                    <div className="group p-10 rounded-[3.5rem] bg-white/60 dark:bg-[#1A2312] border border-[#283618]/10 dark:border-white/5 hover:border-[#283618]/30 transition-all duration-500 shadow-xl">
                        <div className="w-14 h-14 bg-[#283618] text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg">
                            <Users size={28} />
                        </div>
                        <h3 className="text-2xl font-black font-slab text-[#283618] dark:text-white mb-4 uppercase tracking-tight">Units</h3>
                        <p className="text-[#606C38] dark:text-[#9AAD59] text-xs font-black uppercase tracking-widest mb-4">Organizational Houses</p>
                        <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-6">
                            Distinct collectives where teamwork meets strategy. Each unit operates as a main branch of the festival tree.
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-black text-[#283618] dark:text-[#9AAD59] uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-[#9AAD59]"></span>
                            {state?.teams.length || 0} Registered Units
                        </div>
                    </div>

                    {/* Categories / Scopes Info */}
                    <div className="group p-10 rounded-[3.5rem] bg-white/60 dark:bg-[#1A2312] border border-[#283618]/10 dark:border-white/5 hover:border-[#606C38]/30 transition-all duration-500 shadow-xl">
                        <div className="w-14 h-14 bg-[#606C38] text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg">
                            <Layers size={28} />
                        </div>
                        <h3 className="text-2xl font-black font-slab text-[#283618] dark:text-white mb-4 uppercase tracking-tight">Scopes</h3>
                        <p className="text-[#606C38] dark:text-[#9AAD59] text-xs font-black uppercase tracking-widest mb-4">Participation Levels</p>
                        <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-6">
                            Defined rings of competition. From Sub-Juniors to Seniors, ensuring fair and leveled intellectual challenges.
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-black text-[#283618] dark:text-[#9AAD59] uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-[#9AAD59]"></span>
                            {state?.categories.length || 0} Growth Scopes
                        </div>
                    </div>

                    {/* Items / Disciplines Info */}
                    <div className="group p-10 rounded-[3.5rem] bg-white/60 dark:bg-[#1A2312] border border-[#283618]/10 dark:border-white/5 hover:border-[#9AAD59]/30 transition-all duration-500 shadow-xl">
                        <div className="w-14 h-14 bg-[#9AAD59] text-[#283618] rounded-2xl flex items-center justify-center mb-8 shadow-lg">
                            <BookOpen size={28} />
                        </div>
                        <h3 className="text-2xl font-black font-slab text-[#283618] dark:text-white mb-4 uppercase tracking-tight">Disciplines</h3>
                        <p className="text-[#606C38] dark:text-[#9AAD59] text-xs font-black uppercase tracking-widest mb-4">Competitions</p>
                        <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-6">
                            A curated selection of literary, stage, and artistic items. The blossoms that manifest from the rooted tree.
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-black text-[#283618] dark:text-[#9AAD59] uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-[#9AAD59]"></span>
                            {state?.items.length || 0} Registered Items
                        </div>
                    </div>

                    {/* Registry / Statistics */}
                    <div className="group p-10 rounded-[3.5rem] bg-[#283618] border border-white/5 transition-all duration-500 shadow-2xl">
                        <div className="w-14 h-14 bg-white/10 text-[#9AAD59] rounded-2xl flex items-center justify-center mb-8 shadow-lg">
                            <CheckCircle2 size={28} />
                        </div>
                        <h3 className="text-2xl font-black font-slab text-white mb-4 uppercase tracking-tight">Registry</h3>
                        <p className="text-[#9AAD59] text-xs font-black uppercase tracking-widest mb-4">Live Statistics</p>
                        <div className="space-y-4 pt-2">
                            <div className="flex justify-between items-center text-white/60 text-[10px] font-bold uppercase tracking-wider">
                                <span>Total Delegates</span>
                                <span className="text-white font-black">{state?.participants.length || 0}</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-1">
                                <div className="bg-[#9AAD59] h-full rounded-full" style={{ width: '85%' }}></div>
                            </div>
                            <div className="flex justify-between items-center text-white/60 text-[10px] font-bold uppercase tracking-wider">
                                <span>Results Declared</span>
                                <span className="text-white font-black">{state?.results.filter(r => r.status === 'Declared').length || 0}</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-1">
                                <div className="bg-[#9AAD59] h-full rounded-full" style={{ width: '45%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Portal Section */}
            <section id="portal" className="relative z-10 max-w-7xl mx-auto px-6 py-48 text-center flex flex-col items-center">
                <div className="max-w-md w-full">
                    <div className="mb-16">
                        <div className="w-16 h-1 w-16 bg-[#9AAD59] mx-auto mb-6 rounded-full shadow-[0_0_15px_rgba(154,168,106,0.5)]"></div>
                        <h2 className="text-5xl font-black uppercase tracking-tighter mb-4 text-[#283618] dark:text-white">The Console</h2>
                        <p className="text-[#606C38] dark:text-[#9AAD59] font-bold uppercase tracking-[0.3em] text-[10px]">Secure Identity Verification</p>
                    </div>

                    {isUnassigned ? (
                        <div className="p-12 rounded-[3.5rem] bg-white dark:bg-[#1A2312] border border-[#283618]/10 dark:border-white/10 backdrop-blur-3xl shadow-2xl animate-in zoom-in duration-500">
                             <AlertCircle size={56} className="mx-auto mb-8 text-amber-600" />
                             <h3 className="text-2xl font-black mb-4 text-[#283618] dark:text-white uppercase tracking-tight">Access Pending</h3>
                             <p className="text-[#606C38] dark:text-[#9AAD59] text-sm mb-10 leading-relaxed font-medium">
                                Authenticated as <strong className="text-[#283618] dark:text-white">{firebaseUser?.email}</strong>. <br/>Awaiting registry assignment.
                             </p>
                             <button onClick={logout} className="w-full py-5 bg-[#283618] dark:bg-white text-white dark:text-[#283618] rounded-3xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                                <LogOut size={18} /> Relinquish Handle
                             </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-12 rounded-[3.5rem] bg-white/90 dark:bg-[#121412]/80 border-2 border-[#283618]/5 dark:border-white/5 backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-12 duration-1000">
                            <div className="space-y-5">
                                <div className="relative group">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-[#606C38] dark:text-zinc-500 group-focus-within:text-[#9AAD59] transition-colors" size={20} />
                                    <input 
                                        type="text" 
                                        placeholder="Registry Handle" 
                                        required 
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        className="w-full pl-14 pr-6 py-5 rounded-3xl bg-[#F1F5DC]/50 dark:bg-white/5 border border-[#283618]/10 dark:border-white/10 focus:border-[#9AAD59] outline-none transition-all font-bold text-sm text-[#283618] dark:text-white placeholder-[#606C38]/40"
                                    />
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#606C38] dark:text-zinc-500 group-focus-within:text-[#9AAD59] transition-colors" size={20} />
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="Access Key" 
                                        required 
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full pl-14 pr-14 py-5 rounded-3xl bg-[#F1F5DC]/50 dark:bg-white/5 border border-[#283618]/10 dark:border-white/10 focus:border-[#9AAD59] outline-none transition-all font-bold text-sm text-[#283618] dark:text-white placeholder-[#606C38]/40"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#283618] dark:hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                                    </button>
                                </div>
                            </div>

                            {error && <div className="mt-6 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest animate-pulse">{error}</div>}

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full py-6 bg-[#283618] dark:bg-[#9AAD59] text-white dark:text-[#283618] rounded-3xl font-black uppercase tracking-[0.4em] text-xs shadow-2xl shadow-[#283618]/40 dark:shadow-[#9AAD59]/20 mt-10 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Synthesizing...' : 'Authorize Access'}
                            </button>
                            
                            <p className="mt-8 text-[9px] font-black text-[#606C38] dark:text-zinc-600 uppercase tracking-[0.5em]">
                                Authentication Suite v3.2
                            </p>
                        </form>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-20 border-t border-[#283618]/5 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10 text-center md:text-left">
                    <div className="space-y-2">
                        <p className="text-[#283618] dark:text-white text-lg font-black uppercase tracking-tighter">AMAZIO 2026</p>
                        <p className="text-[#606C38] dark:text-[#9AAD59] text-[10px] font-black uppercase tracking-[0.4em]">The Rooted Tree • Knowledge Fest Edition</p>
                    </div>
                    <div className="flex flex-wrap justify-center items-center gap-10">
                        <a href="#" className="text-[#606C38] dark:text-zinc-500 hover:text-[#283618] dark:hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">Visual identity</a>
                        <a href="#" className="text-[#606C38] dark:text-zinc-500 hover:text-[#283618] dark:hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">Registry Specs</a>
                        <a href="#" className="text-[#606C38] dark:text-zinc-500 hover:text-[#283618] dark:hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">Core Infrastructure</a>
                    </div>
                </div>
            </footer>

            <style>{`
                html { scroll-behavior: smooth; }
                .ease-out-expo { transition-timing-function: cubic-bezier(0.19, 1, 0.22, 1); }
                @keyframes shimmer-sweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
                .animate-shimmer { animation: shimmer-sweep 2s infinite ease-in-out; }
            `}</style>
        </div>
    );
};

export default LandingPage;