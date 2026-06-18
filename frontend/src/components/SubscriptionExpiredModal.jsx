import React from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";

/**
 * Superposition affichée quand l'abonnement du tenant est expiré.
 * Couvre la zone de contenu (grise/floute) et propose d'aller renouveler.
 * La sidebar reste accessible ; la page Compte n'est pas bloquée (pour renouveler).
 */
const SubscriptionExpiredModal = ({ onRenew }) => (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 grid place-items-center mx-auto mb-5">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Abonnement expiré</h2>
            <p className="mt-3 text-slate-500 leading-relaxed">
                Votre abonnement est arrivé à échéance. Les fonctionnalités de votre espace sont
                temporairement désactivées. Renouvelez votre abonnement pour tout réactiver.
            </p>
            <button
                onClick={onRenew}
                className="mt-7 w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
                Renouveler mon abonnement
                <ArrowRight className="w-5 h-5" />
            </button>
            <p className="mt-3 text-xs text-slate-400">Besoin d'aide ? contact@cmidigit.com</p>
        </div>
    </div>
);

export default SubscriptionExpiredModal;
