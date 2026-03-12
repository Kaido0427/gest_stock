import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, LogIn, Store } from "lucide-react";
import { useLogin } from "../../hooks/useAuth";

const LoginPage = ({ onSwitchToRegister }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const { mutate: login, isPending } = useLogin();

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");
        login(
            { email, password },
            {
                onError: (err) => setError(err?.response?.data?.error || "Erreur de connexion"),
                onSuccess: (data) => { if (data?.error) setError(data.error); },
            }
        );
    };

    const inputCls = "w-full py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 text-slate-700 placeholder-slate-400 text-sm transition-all disabled:opacity-50";

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-10">
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Store className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900">Connexion</h1>
                        <p className="text-sm text-slate-500 mt-1">Accédez à votre espace de gestion</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input type="email" placeholder="vous@exemple.com" value={email}
                                    onChange={(e) => setEmail(e.target.value)} required disabled={isPending}
                                    className={`${inputCls} pl-11 pr-4`} />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Mot de passe</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input type={showPassword ? "text" : "password"} placeholder="••••••••"
                                    value={password} onChange={(e) => setPassword(e.target.value)}
                                    required disabled={isPending} className={`${inputCls} pl-11 pr-12`} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex="-1">
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={isPending}
                            className="w-full mt-2 bg-slate-900 hover:bg-slate-700 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                            {isPending ? (
                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Connexion...</>
                            ) : (
                                <><LogIn className="w-5 h-5" />Se connecter</>
                            )}
                        </button>
                    </form>

                    {onSwitchToRegister && (
                        <p className="text-sm text-slate-500 text-center mt-6">
                            Pas encore de compte ?{" "}
                            <button onClick={onSwitchToRegister} className="font-bold text-slate-900 hover:underline">
                                Créer un compte
                            </button>
                        </p>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;