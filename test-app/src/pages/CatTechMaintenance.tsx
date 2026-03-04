import React, { useState } from "react";
import AreaCatMap from "../components/complaintcomponents/AreaCatMap";
import AddCategory from "../components/complaintcomponents/AddCategory";
import TechCatMap from "../components/complaintcomponents/TechCatMap";
import AreaTechMap from "../components/complaintcomponents/TechReport"; // <-- import this

export default function CatTechMaintenance() {
  const [mainToggle, setMainToggle] = useState<"settings" | "report">("settings");

  return (
    <div className="container mx-auto p-4 dark:bg-gray-800">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-left text-gray-800 dark:text-gray-100">
          Technician Settings
        </h1>
        <div className="flex rounded-lg overflow-hidden border border-blue-600">
          <button
            className={`px-4 py-2 font-semibold transition-colors ${
              mainToggle === "settings"
                ? "bg-blue-600 text-white"
                : "bg-white text-blue-600"
            }`}
            style={{ minWidth: 120 }}
            onClick={() => setMainToggle("settings")}
            type="button"
          >
            Settings
          </button>
          <button
            className={`px-4 py-2 font-semibold transition-colors ${
              mainToggle === "report"
                ? "bg-blue-600 text-white"
                : "bg-white text-blue-600"
            }`}
            style={{ minWidth: 120 }}
            onClick={() => setMainToggle("report")}
            type="button"
          >
            Report
          </button>
        </div>
      </div>
      {mainToggle === "settings" ? <TechCatMap /> : <AreaTechMap />}
    </div>
  );
}