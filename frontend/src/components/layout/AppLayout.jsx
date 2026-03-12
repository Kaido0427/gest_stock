import React, { useState, useRef } from "react";
import { ArrowUp } from "lucide-react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

const AppLayout = ({ user, onLogout, currentPage, onPageChange, children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const scrollRef = useRef(null);

    const handleScroll = () => {
        if (scrollRef.current) {
            setShowScrollTop(scrollRef.current.scrollTop > 300);
        }
    };

    return (
        <div className="flex h-screen bg-[#f5f6fa] overflow-hidden">
            <Sidebar
                currentPage={currentPage}
                onPageChange={onPageChange}
                onLogout={onLogout}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                user={user}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                <TopBar
                    onMenuOpen={() => setSidebarOpen(true)}
                    tenantName={user?.tenant?.name}
                />

                <main
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-auto"
                >
                    {children}
                </main>
            </div>

            {showScrollTop && (
                <button
                    onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
                    className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white p-3 rounded-full shadow-lg hover:bg-slate-700 transition-colors"
                    aria-label="Remonter"
                >
                    <ArrowUp className="w-5 h-5" />
                </button>
            )}
        </div>
    );
};

export default AppLayout;