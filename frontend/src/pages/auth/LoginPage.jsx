import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useLogin } from "../../hooks/useAuth";
import AuthShell from "../../components/auth/AuthShell";

const LoginPage = ({ onSwitchToRegister, onSwitchToForgot }) => {
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

    return (
        <AuthShell>
            <h2 className="text-3xl font-extrabold text-slate-900">Bienvenue</h2>
            <p className="mt-2 text-slate-500">Connectez-vous à votre espace de gestion.</p>

            {error && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium"
                >
                    {error}
                </motion.div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                {/* Email */}
                <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                        Adresse email
                    </label>
                    <div className="group flex border-2 border-slate-200 rounded-xl overflow-hidden transition-all focus-within:ring-2 focus-within:ring-primary-200 focus-within:border-primary-500">
                        <span className="w-12 grid place-items-center bg-primary-600 text-white">
                            <Mail className="w-5 h-5" />
                        </span>
                        <input
                            id="email"
                            type="email"
                            placeholder="vous@exemple.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isPending}
                            className="flex-1 px-4 py-3 outline-none text-slate-700 placeholder-slate-400 disabled:opacity-50"
                        />
                    </div>
                </div>

                {/* Mot de passe */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                            Mot de passe
                        </label>
                        <button
                            type="button"
                            onClick={onSwitchToForgot}
                            className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                        >
                            Mot de passe oublié ?
                        </button>
                    </div>
                    <div className="group flex border-2 border-slate-200 rounded-xl overflow-hidden transition-all focus-within:ring-2 focus-within:ring-primary-200 focus-within:border-primary-500">
                        <span className="w-12 grid place-items-center bg-primary-600 text-white">
                            <Lock className="w-5 h-5" />
                        </span>
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isPending}
                            className="flex-1 px-4 py-3 outline-none text-slate-700 placeholder-slate-400 disabled:opacity-50"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((s) => !s)}
                            tabIndex={-1}
                            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                            className="px-3 text-slate-400 hover:text-slate-600"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Bouton */}
                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isPending ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Connexion...
                        </>
                    ) : (
                        <>
                            Se connecter
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </form>

            {onSwitchToRegister && (
                <p className="text-sm text-slate-500 text-center mt-6">
                    Pas encore de compte ?{" "}
                    <button
                        onClick={onSwitchToRegister}
                        className="font-bold text-primary-600 hover:text-primary-700 hover:underline"
                    >
                        Créer un compte
                    </button>
                </p>
            )}
        </AuthShell>
    );
};

export default LoginPage;
