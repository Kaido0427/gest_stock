import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import { useResetPassword } from "../../hooks/useAuth";
import AuthShell from "../../components/auth/AuthShell";

const ResetPasswordPage = ({ token, onDone }) => {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);

    const { mutate: reset, isPending } = useResetPassword();

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");
        if (password.length < 6) return setError("Le mot de passe doit contenir au moins 6 caractères.");
        if (password !== confirm) return setError("Les deux mots de passe ne correspondent pas.");

        reset(
            { token, password },
            {
                onError: (err) =>
                    setError(err?.response?.data?.error || "Lien invalide ou expiré. Refaites une demande."),
                onSuccess: (data) => {
                    if (data?.error) setError(data.error);
                    else setDone(true);
                },
            }
        );
    };

    if (done) {
        return (
            <AuthShell>
                <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-green-100 grid place-items-center mx-auto mb-5">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900">Mot de passe modifié</h2>
                    <p className="mt-3 text-slate-500 leading-relaxed">
                        Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.
                    </p>
                    <button
                        onClick={onDone}
                        className="mt-8 w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                        Aller à la connexion <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </AuthShell>
        );
    }

    return (
        <AuthShell>
            <h2 className="text-3xl font-extrabold text-slate-900">Nouveau mot de passe</h2>
            <p className="mt-2 text-slate-500">Choisissez un nouveau mot de passe pour votre compte.</p>

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
                {/* Nouveau mot de passe */}
                <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                        Nouveau mot de passe
                    </label>
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

                {/* Confirmation */}
                <div>
                    <label htmlFor="confirm" className="block text-sm font-semibold text-slate-700 mb-2">
                        Confirmer le mot de passe
                    </label>
                    <div className="group flex border-2 border-slate-200 rounded-xl overflow-hidden transition-all focus-within:ring-2 focus-within:ring-primary-200 focus-within:border-primary-500">
                        <span className="w-12 grid place-items-center bg-primary-600 text-white">
                            <Lock className="w-5 h-5" />
                        </span>
                        <input
                            id="confirm"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            required
                            disabled={isPending}
                            className="flex-1 px-4 py-3 outline-none text-slate-700 placeholder-slate-400 disabled:opacity-50"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isPending ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Réinitialisation...
                        </>
                    ) : (
                        <>
                            Réinitialiser le mot de passe
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </form>
        </AuthShell>
    );
};

export default ResetPasswordPage;
