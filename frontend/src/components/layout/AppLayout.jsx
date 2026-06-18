import React, { useState, useRef } from "react";
import { ArrowUp } from "lucide-react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import Footer from "./Footer";
import SubscriptionExpiredModal from "../SubscriptionExpiredModal";

const AppLayout = ({ user, onLogout, currentPage, onPageChange, children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const scrollRef = useRef(null);

    const handleScroll = () => {
        if (scrollRef.current) {
            setShowScrollTop(scrollRef.current.scrollTop > 300);
        }
    };

    // Abonnement expiré (ou essai échu) → on bloque tout sauf la page Compte (pour renouveler)
    const tenant = user?.tenant;
    const trialExpired =
        tenant?.status === "trial" && tenant?.trialEndsAt && new Date(tenant.trialEndsAt) < new Date();
    const isExpired = tenant?.status === "expired" || trialExpired;
    const blockApp = isExpired && currentPage !== "compte";

    const handleRenew = () => {
        onPageChange("compte");
        setTimeout(() => {
            document.getElementById("abonnement")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 200);
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

            <div className="flex-1 flex flex-col overflow-hidden relative">
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

                <Footer />

                {blockApp && <SubscriptionExpiredModal onRenew={handleRenew} />}
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