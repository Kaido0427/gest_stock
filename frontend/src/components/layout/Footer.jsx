import React from "react";

const Footer = () => (
    <footer className="shrink-0 bg-white border-t border-slate-200 px-6 py-2 text-center text-xs text-slate-400 space-y-0.5">
        <p>© {new Date().getFullYear()} <span className="font-medium text-slate-500">CMIDigit</span>. Tous droits réservés.</p>
        <p>
            <a href="tel:+2290196123241" className="hover:text-slate-600">+229 01 96 12 32 41</a>
            {" · "}
            <a href="tel:+2290195734692" className="hover:text-slate-600">+229 01 95 73 46 92</a>
            {" · "}
            <a href="tel:+23672608994" className="hover:text-slate-600">+236 72 60 89 94</a>
            {" · "}
            <a href="mailto:contact@cmidigit.com" className="hover:text-slate-600">contact@cmidigit.com</a>
        </p>
    </footer>
);

export default Footer;
