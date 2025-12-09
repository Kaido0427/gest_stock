import React from "react";
import { Settings } from "lucide-react";

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Paramètres</h1>
      <div className="bg-white p-12 rounded-xl shadow text-center">
        <Settings className="w-24 h-24 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Configuration</h2>
        <p className="text-gray-600">
          Paramètres de la boutique et préférences
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;
