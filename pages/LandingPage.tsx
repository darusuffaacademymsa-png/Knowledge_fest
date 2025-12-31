
import React, { useState, useEffect } from 'react';
import { 
    Sparkles, ArrowRight, ShieldCheck, Trophy, Palette, 
    Monitor, Users, Zap, ChevronDown, Lock, User, 
    Sun, Moon, Laptop, Eye, EyeOff, LogOut, AlertCircle,
    Flag, Layers, Calendar, Gavel, BookOpen
} from 'lucide-react';
import { useFirebase } from '../hooks/useFirebase';
import { Settings, PerformanceType } from '../types';

interface LandingPageProps {
    theme: string;
    toggleTheme: (theme: 'light' | 'dark' | 'system') => void;
    settings: Settings;
}

const FeatureCard = ({ icon: Icon, title, description, color }: { icon: any, title: string, description: string, color: string }) => (
    <div className="group relative p-8 rounded-[2.5rem] bg-white/60 dark:bg-white/5 border border-amazio-primary/5 dark:border-white/10 hover:border-amazio-primary/20 dark:hover:border-white/20 transition-all duration-500 hover:-translate-y-2 backdrop-blur-md shadow-glass-light dark:shadow-none">
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${color}`}></div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${color} text-white`}>
            <Icon size={28} />
        </div>
        <h3 className="text-2xl font-black font-serif text-amazio-primary dark:text-white mb-3 uppercase tracking-tighter">{title}</h3>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed font-medium">{description}</p>
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
            setError('Authentication failed. Check credentials.');
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
        <div className="min-h-screen bg-amazio-light-bg dark:bg-amazio-bg text-amazio-primary dark:text-white selection:bg-amazio-accent selection:text-amazio-bg overflow-x-hidden font-sans transition-colors duration-500">
            
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-amazio-secondary/10 dark:bg-amazio-primary/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-amazio-accent/15 dark:bg-amazio-accent/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay"></div>
            </div>

            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled ? 'bg-white/80 dark:bg-amazio-bg/80 backdrop-blur-xl border-b border-amazio-primary/5 dark:border-white/5 py-4' : 'bg-transparent py-8'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amazio-primary to-amazio-secondary dark:from-amazio-accent dark:to-amazio-secondary flex items-center justify-center font-serif text-xl font-black shadow-lg text-white">A</div>
                        <span className="text-2xl font-black font-serif tracking-tighter uppercase hidden sm:block text-amazio-primary dark:text-white">AMAZIO <span className="text-amazio-secondary dark:text-amazio-accent">2026.</span></span>
                    </div>
                    
                    <div className="flex items-center gap-4 sm:gap-6">
                        <button 
                            onClick={() => toggleTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:text-amazio-primary dark:hover:text-white transition-all"
                        >
                            {getThemeIcon()}
                        </button>
                        <a href="#portal" className="px-6 py-2.5 bg-amazio-primary dark:bg-white text-white dark:text-black rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-amazio-primary/20 dark:shadow-white/10">
                            Portal Access
                        </a>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 pt-48 pb-32 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amazio-secondary/10 dark:bg-amazio-accent/10 rounded-full border border-amazio-secondary/20 dark:border-amazio-accent/20 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Sparkles size={14} className="text-amazio-secondary dark:text-amazio-accent" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amazio-secondary dark:text-amazio-accent">Knowledge Fest 2026 Edition</span>
                    </div>
                    
                    <h1 className="text-5xl md:text-8xl lg:text-[120px] font-black font-serif leading-[0.9] tracking-tighter uppercase mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                        <span className="text-amazio-primary dark:text-white">Amazio</span> <br/> 
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amazio-secondary via-amazio-primary to-amazio-secondary dark:from-amazio-accent dark:via-white dark:to-amazio-secondary">Knowledge Fest.</span>
                    </h1>
                    
                    <p className="max-w-2xl mx-auto text-zinc-600 dark:text-zinc-400 text-lg md:text-xl font-medium mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        The ultimate management terminal for the 2026 edition of Amazio. Custom-engineered for orchestrating intelligence, talent, and competition.
                    </p>

                    <div className="flex flex-wrap justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                        <a href="#portal" className="px-10 py-5 bg-amazio-primary dark:bg-amazio-accent text-white dark:text-amazio-bg rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-amazio-primary/20 dark:shadow-amazio-accent/20">
                            Enter Console <ArrowRight size={18} />
                        </a>
                        <a href="#features" className="px-10 py-5 bg-white/80 dark:bg-white/5 border border-amazio-primary/10 dark:border-white/10 text-amazio-primary dark:text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-white dark:hover:bg-white/10 transition-all shadow-sm">
                            Feature Highlights
                        </a>
                    </div>
                </div>
            </section>

            {/* Live Stats Bar */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 mb-32">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 rounded-[3rem] bg-white/60 dark:bg-white/5 border border-amazio-primary/5 dark:border-white/5 backdrop-blur-3xl shadow-glass-light dark:shadow-none animate-in fade-in zoom-in duration-1000">
                    {[
                        { label: 'Delegates', value: state?.participants.length || 0, icon: Users, color: 'text-blue-500 dark:text-blue-400' },
                        { label: 'Units', value: state?.teams.length || 0, icon: Flag, color: 'text-emerald-500 dark:text-emerald-400' },
                        { label: 'Disciplines', value: state?.items.length || 0, icon: BookOpen, color: 'text-amber-500 dark:text-amber-400' },
                        { label: 'Timeline', value: state?.schedule.length || 0, icon: Calendar, color: 'text-rose-500 dark:text-rose-400' },
                    ].map((stat, i) => (
                        <div key={i} className="text-center md:border-r last:border-0 border-amazio-primary/10 dark:border-white/10 px-4">
                            <stat.icon className={`mx-auto mb-3 opacity-70 ${stat.color}`} size={20} />
                            <div className="text-3xl font-black font-inter leading-none mb-1 text-amazio-primary dark:text-white">{stat.value}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-500">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-32 border-t border-amazio-primary/5 dark:border-white/5">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-6xl font-black font-serif uppercase tracking-tighter mb-4 text-amazio-primary dark:text-white">The Amazio Ecosystem</h2>
                    <p className="text-zinc-600 dark:text-zinc-500 font-medium text-lg">Integrated modules purpose-built for the 2026 Knowledge Fest.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <FeatureCard 
                        icon={Users} 
                        title="Census Control" 
                        description="Streamlined delegate registration with strict category enforcement and unit mapping." 
                        color="bg-indigo-600"
                    />
                    <FeatureCard 
                        icon={Gavel} 
                        title="Adjudication" 
                        description="The official scoring terminal for judges featuring real-time Mean % calculations." 
                        color="bg-rose-600"
                    />
                    <FeatureCard 
                        icon={Palette} 
                        title="Output Studio" 
                        description="Instant generation of posters and digital certificates for Amazio winners." 
                        color="bg-emerald-600"
                    />
                    <FeatureCard 
                        icon={Monitor} 
                        title="Broadcast" 
                        description="Cinematic projector mode for live leaderboard races and event results." 
                        color="bg-amber-600"
                    />
                </div>
            </section>

            {/* Portal Section */}
            <section id="portal" className="relative z-10 max-w-7xl mx-auto px-6 py-48 text-center flex flex-col items-center">
                <div className="max-w-md w-full">
                    <div className="mb-12">
                        <h2 className="text-4xl font-black font-serif uppercase tracking-tighter mb-4 text-amazio-primary dark:text-white">Fest Portal</h2>
                        <p className="text-zinc-500 font-medium uppercase tracking-[0.2em] text-[10px]">Identity & Access Management</p>
                    </div>

                    {isUnassigned ? (
                        <div className="p-10 rounded-[3rem] bg-white dark:bg-white/5 border border-amazio-primary/5 dark:border-white/10 backdrop-blur-3xl shadow-xl animate-in zoom-in duration-500">
                             <AlertCircle size={48} className="mx-auto mb-6 text-amber-500" />
                             <h3 className="text-xl font-bold mb-2 text-amazio-primary dark:text-white">Access Pending</h3>
                             <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-8 leading-relaxed">
                                You are authenticated as <strong className="text-amazio-primary dark:text-white">{firebaseUser?.email}</strong> but haven't been assigned an Amazio role yet.
                             </p>
                             <button onClick={logout} className="w-full py-4 bg-amazio-primary dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-lg">
                                <LogOut size={16} /> Sign Out
                             </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-10 rounded-[3rem] bg-white/80 dark:bg-white/5 border border-amazio-primary/5 dark:border-white/10 backdrop-blur-3xl shadow-2xl animate-in slide-in-from-bottom-12 duration-1000">
                            <div className="space-y-4">
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="Username" 
                                        required 
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-amazio-primary/5 dark:border-white/10 focus:border-amazio-secondary/50 dark:focus:border-amazio-accent/50 outline-none transition-all font-bold text-sm text-amazio-primary dark:text-white"
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="Password" 
                                        required 
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-12 py-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-amazio-primary/5 dark:border-white/10 focus:border-amazio-secondary/50 dark:focus:border-amazio-accent/50 outline-none transition-all font-bold text-sm text-amazio-primary dark:text-white"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amazio-primary dark:hover:text-white"
                                    >
                                        {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                    </button>
                                </div>
                            </div>

                            {error && <div className="mt-4 text-rose-500 text-xs font-bold uppercase tracking-wider">{error}</div>}

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full py-5 bg-gradient-to-r from-amazio-primary to-amazio-secondary dark:from-amazio-accent dark:to-amazio-secondary text-white dark:text-amazio-bg rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-amazio-primary/20 dark:shadow-amazio-accent/20 mt-8 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Validating...' : 'Enter Console'}
                            </button>
                            
                            <p className="mt-6 text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">
                                AMAZIO 2026 PERSONNEL ONLY
                            </p>
                        </form>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-12 border-t border-amazio-primary/5 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-zinc-400 dark:text-zinc-600 text-xs font-bold uppercase tracking-[0.3em]">© 2026 AMAZIO KNOWLEDGE FEST • 2026 EDITION</p>
                    <div className="flex items-center gap-6">
                        <a href="#" className="text-zinc-400 hover:text-amazio-primary dark:text-zinc-600 dark:hover:text-white text-xs font-black uppercase tracking-widest transition-colors">Orchestration Guide</a>
                        <a href="#" className="text-zinc-400 hover:text-amazio-primary dark:text-zinc-600 dark:hover:text-white text-xs font-black uppercase tracking-widest transition-colors">Infrastructure</a>
                    </div>
                </div>
            </footer>

            <style>{`
                html { scroll-behavior: smooth; }
                .ease-out-expo { transition-timing-function: cubic-bezier(0.19, 1, 0.22, 1); }
                @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
                .animate-shimmer { animation: shimmer 2s infinite linear; }
            `}</style>
        </div>
    );
};

export default LandingPage;
