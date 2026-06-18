import React from "react";
import { motion } from "framer-motion";
import { Package, Receipt, BarChart3 } from "lucide-react";
import Footer from "../layout/Footer";

/**
 * Coquille commune aux écrans d'authentification :
 * panneau de marque (gauche, fond CMI) + zone de contenu (droite) + footer.
 */
const AuthShell = ({ children }) => (
    <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex">

            {/* ===================== PANNEAU MARQUE (gauche) ===================== */}
            <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-slate-900 text-white">
                <div
                    className="absolute inset-0 bg-cover bg-center blur-sm scale-110"
                    style={{ backgroundImage: "url('/cmidigit_bg.png')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-primary-900/80 via-primary-900/40 to-transparent" />

                {/* Bulles flottantes */}
                <div className="absolute inset-0 pointer-events-none opacity-25">
                    {[...Array(16)].map((_, i) => (
                        <span
                            key={i}
                            className="absolute w-2 h-2 bg-white rounded-full animate-authfloat"
                            style={{
                                left: `${Math.random() * 100}%`,
                                bottom: "-10px",
                                animationDelay: `${Math.random() * 6}s`,
                                animationDuration: `${8 + Math.random() * 10}s`,
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10 flex flex-col justify-between w-full p-14 xl:p-20">
                    <div className="inline-flex items-center gap-3 bg-white rounded-2xl px-4 py-2 shadow-lg w-max">
                        <img src="/logo_cmidiogit.jpeg" alt="CMI" className="h-10 w-auto" />
                    </div>

                    <div className="max-w-lg">
                        <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight">
                            Votre stock,<br />sous contrôle.
                        </h1>
                        <p className="mt-5 text-lg text-primary-100/90 leading-relaxed">
                            Produits, ventes, alertes de rupture et statistiques — pilotez tout votre
                            commerce depuis un seul tableau de bord, en temps réel.
                        </p>
                        <ul className="mt-8 space-y-3 text-primary-50">
                            <li className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-lg bg-white/10 grid place-items-center">
                                    <Package className="w-5 h-5 text-primary-200" />
                                </span>
                                Inventaire &amp; alertes de stock
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-lg bg-white/10 grid place-items-center">
                                    <Receipt className="w-5 h-5 text-primary-200" />
                                </span>
                                Ventes &amp; encaissement rapides
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-lg bg-white/10 grid place-items-center">
                                    <BarChart3 className="w-5 h-5 text-primary-200" />
                                </span>
                                Statistiques en temps réel
                            </li>
                        </ul>
                    </div>

                    <div aria-hidden />
                </div>
            </div>

            {/* ===================== CONTENU (droite) ===================== */}
            <div className="w-full lg:w-[45%] relative flex items-center justify-center p-6 sm:p-12 bg-slate-50">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md"
                >
                    <div className="lg:hidden flex justify-center mb-8">
                        <img src="/logo_cmidiogit.jpeg" alt="CMI" className="h-16 w-auto" />
                    </div>
                    {children}
                </motion.div>
            </div>
        </div>

        <Footer />

        <style>{`
            @keyframes authfloat {
                0% { transform: translateY(0); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translateY(-110vh); opacity: 0; }
            }
            .animate-authfloat { animation: authfloat linear infinite; }
        `}</style>
    </div>
);

export default AuthShell;
