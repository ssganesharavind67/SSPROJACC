import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, ClipboardList, Package, Receipt, Users, FileText, Bot, Bell, Search, Settings, BookOpen, Menu, X } from 'lucide-react';
import clsx from 'clsx';
import ChatModal from '../ui/ChatModal';
import QuickAddModal from '../ui/QuickAddModal';

const SidebarItem = ({ to, icon: Icon, label }) => {
    const location = useLocation();
    const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

    return (
        <Link
            to={to}
            className={clsx(
                'flex items-center gap-3 px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-300 group relative overflow-hidden',
                isActive
                    ? 'text-white bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/20 shadow-lg shadow-blue-500/10'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
            )}
        >
            {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-r-full" />
            )}
            <Icon size={20} className={clsx("transition-colors", isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300")} />
            <span>{label}</span>
            {isActive && (
                <div className="absolute inset-0 bg-blue-400/5 blur-xl rounded-xl -z-10" />
            )}
        </Link>
    );
};

const Layout = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    // Close mobile menu on route change
    React.useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden selection:bg-cyan-500/30">
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                "fixed lg:static inset-y-0 left-0 z-40 w-72 bg-slate-900/50 backdrop-blur-2xl border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-8 pb-6 flex justify-between items-center">
                    <div className="flex items-center gap-3 mb-1">
                        <img
                            src="/logo.jpg"
                            alt="Soletti Sagasi"
                            className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-blue-500/20"
                        />
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-white">
                                Soletti Sagasi
                            </h1>
                            <p className="text-xs text-slate-500 font-medium tracking-wide">BuildBuddy</p>
                        </div>
                    </div>
                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="lg:hidden p-2 text-slate-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="px-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full bg-slate-950/50 border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder:text-slate-600"
                        />
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto px-4 space-y-1.5 custom-scrollbar">
                    <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 mb-2 mt-2">Main</div>
                    <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
                    <SidebarItem to="/projects" icon={FolderKanban} label="Projects" />
                    <SidebarItem to="/logs" icon={ClipboardList} label="Daily Logs" />
                    <SidebarItem to="/playbook" icon={BookOpen} label="Weekly Playbook" />

                    <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 mb-2 mt-6">Resources</div>
                    <SidebarItem to="/inventory" icon={Package} label="Inventory" />
                    <SidebarItem to="/expenses" icon={Receipt} label="Expenses" />
                    <SidebarItem to="/vendors" icon={Users} label="Vendors" />
                    <SidebarItem to="/reports" icon={FileText} label="Reports" />
                    <SidebarItem to="/settings" icon={Settings} label="Settings" />
                </nav>

                <div className="p-4 border-t border-white/5 bg-slate-900/30">
                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="flex items-center gap-3 px-4 py-3 w-full text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all active:scale-95 group"
                    >
                        <div className="bg-white/20 p-1 rounded-lg">
                            <Bot size={16} />
                        </div>
                        <span className="flex-1 text-left">Ask AI Assistant</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-hidden w-full">
                {/* Decorative Background Blobs */}
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

                <header className="h-20 border-b border-white/5 flex items-center justify-between px-4 lg:px-8 bg-slate-950/30 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <Menu size={24} />
                        </button>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-100">Overview</h2>
                            <p className="text-xs text-slate-500 hidden sm:block">Welcome back, Ganesh</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={() => setIsQuickAddOpen(true)}
                            className="hidden sm:flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-blue-500/20"
                        >
                            <LayoutDashboard size={18} />
                            <span>Quick Add</span>
                        </button>
                        <button
                            onClick={() => setIsQuickAddOpen(true)}
                            className="sm:hidden p-2 text-blue-400 hover:text-white hover:bg-blue-500/10 rounded-lg transition-colors"
                        >
                            <LayoutDashboard size={20} />
                        </button>


                        <Link to="/settings" className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors hidden sm:block">
                            <Settings size={20} />
                        </Link>
                        <div className="h-8 w-[1px] bg-white/10 mx-2 hidden sm:block"></div>
                        <div className="flex items-center gap-3 pl-2 cursor-pointer hover:opacity-80 transition-opacity">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-medium text-slate-200">Ganesh Aravind</p>
                                <p className="text-xs text-slate-500">Owner</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-600 border border-white/10 flex items-center justify-center text-sm font-bold shadow-lg">
                                GA
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar relative z-0">
                    <Outlet />
                </div>
            </main>

            <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
            <QuickAddModal isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} />
        </div>
    );
};

export default Layout;
