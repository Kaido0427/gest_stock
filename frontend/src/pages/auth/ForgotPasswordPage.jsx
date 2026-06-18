import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useForgotPassword } from "../../hooks/useAuth";
import AuthShell from "../../components/auth/AuthShell";

const ForgotPasswordPage = ({ onBackToLogin }) => {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);

    const { mutate: forgot, isPending } = useForgotPassword();

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");
        forgot(
            { email },
            {
                onError: (err) =>
                    setError(err?.response?.data?.error || "Une erreur est survenue. Réessayez."),
                onSuccess: (data) => {
                    if (data?.error) setError(data.error);
                    else setSent(true);
                },
            }
        );
    };

    if (sent) {
        return (
            <AuthShell>
                <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-green-100 grid place-items-center mx-auto mb-5">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900">Vérifiez vos emails</h2>
                    <p className="mt-3 text-slate-500 leading-relaxed">
                        Si un compte existe pour <span className="font-semibold text-slate-700">{email}</span>,
                        un lien de réinitialisation vient d'y être envoyé. Pensez à regarder vos spams.
                    </p>
                    <button
                        onClick={onBackToLogin}
                        className="mt-8 inline-flex items-center gap-2 font-bold text-primary-600 hover:text-primary-700 hover:underline"
                    >
                        <ArrowLeft className="w-4 h-4" /> Retour à la connexion
                    </button>
                </div>
            </AuthShell>
        );
    }

    return (
        <AuthShell>
            <h2 className="text-3xl font-extrabold text-slate-900">Mot de passe oublié ?</h2>
            <p className="mt-2 text-slate-500">
                Entrez votre adresse email : nous vous enverrons un lien pour le réinitialiser.
            </p>

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

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isPending ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Envoi...
                        </>
                    ) : (
                        <>
                            Envoyer le lien
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </form>

            <button
                onClick={onBackToLogin}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
            >
                <ArrowLeft className="w-4 h-4" /> Retour à la connexion
            </button>
        </AuthShell>
    );
};

export default ForgotPasswordPage;
