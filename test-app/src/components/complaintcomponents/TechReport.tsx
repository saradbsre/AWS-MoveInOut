import React, { useEffect, useState } from "react";
import Select from "react-select";
import {
  getComplaintCategories,
  getAreas,
  getMappedTechs,
  getTechnicians,
  getComplaintDetails,
} from "@/services/Transaction/Contract/Contractapi";
import TechWorkHistory from "./TechWorkHistory";

type Option = { value: string; label: string };

export default function TechReport() {
  // State for left container
  const [filterType, setFilterType] = useState<"category" | "area">("category");
  const [categories, setCategories] = useState<Option[]>([]);
  const [categoryMap, setCategoryMap] = useState<{ [code: string]: string }>({});
  const [areas, setAreas] = useState<Option[]>([]);
  const [areaMap, setAreaMap] = useState<{ [id: string]: string }>({});
  const [mappedTechs, setMappedTechs] = useState<Option[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Option | null>(null);
  const [selectedArea, setSelectedArea] = useState<Option | null>(null);
  const [areaTechnicians, setAreaTechnicians] = useState<Option[]>([]);
  const [complaintDetails, setComplaintDetails] = useState<any[]>([]);

  // State for right container (work history)
  const [workHistoryTech, setWorkHistoryTech] = useState<Option | null>(null);
  const [workHistoryArea, setWorkHistoryArea] = useState<Option | null>(null);

  // State for left container's selected tech (for row highlight)
  const [selectedTech, setSelectedTech] = useState<Option | null>(null);

  // Fetch options
  useEffect(() => {
    getComplaintCategories().then(res => {
      let arr = [];
      if (res && Array.isArray(res)) arr = res;
      else if (res?.categories) arr = res.categories;
      setCategories(
        arr.map((cat: any) => ({
          value: cat.sscode,
          label: cat.sdescr,
        }))
      );
      // Build a map for code -> desc
      const map: { [code: string]: string } = {};
      arr.forEach((cat: any) => {
        map[cat.comp_cat_code] = cat.comp_cat_desc;
      });
      setCategoryMap(map);
    });
    getAreas().then(res => {
      let arr = [];
      if (res && Array.isArray(res)) arr = res;
      else if (res?.areas) arr = res.areas;
      setAreas(
        arr.map((area: any) => ({
          value: area.area_id || area.value || area.code,
          label: area.area_desc || area.label || area.name,
        }))
      );
      // Build a map for area_id -> area_desc
      const amap: { [id: string]: string } = {};
      arr.forEach((area: any) => {
        amap[area.area_id || area.value || area.code] =
          area.area_desc || area.label || area.name;
      });
      setAreaMap(amap);
    });
  }, []);

  // Fetch technicians for right panel area dropdown
  useEffect(() => {
    if (workHistoryArea) {
      getTechnicians(undefined, workHistoryArea.value).then(res => {
        let arr = [];
        if (res && Array.isArray(res)) arr = res;
        else if (res?.technicians) arr = res.technicians;
        setAreaTechnicians(
          arr.map((tech: any) => ({
            value: tech.uname || tech.Uname || tech.value || tech.username,
            label: tech.uname || tech.Uname || tech.label || tech.username,
          }))
        );
      });
    } else {
      setAreaTechnicians([]);
    }
    setWorkHistoryTech(null); // Reset selected tech when area changes
  }, [workHistoryArea]);

  // Fetch complaint details for right panel
  console.log("Fetching complaint details for area:", workHistoryArea);
  useEffect(() => {
    if (workHistoryArea) {
      getComplaintDetails(workHistoryArea.value).then(res => {
        let arr = [];
        if (res && Array.isArray(res)) arr = res;
        else if (res?.complaintDetails) arr = res.complaintDetails;
        setComplaintDetails(arr);
      });
    } else {
      // No area selected: get all
      getComplaintDetails().then(res => {
        let arr = [];
        if (res && Array.isArray(res)) arr = res;
        else if (res?.complaintDetails) arr = res.complaintDetails;
        setComplaintDetails(arr);
      });
    }
  }, [workHistoryArea]);

  // Fetch mapped technicians for left container
  useEffect(() => {
    setSelectedTech(null);
    if (filterType === "category" && selectedCategory) {
      getMappedTechs(selectedCategory.value, undefined).then(res => {
        let arr = [];
        if (res && Array.isArray(res)) arr = res;
        else if (res?.technicians) arr = res.technicians;
        setMappedTechs(
          arr.map((uname: string) => ({
            value: uname,
            label: uname,
          }))
        );
      });
    } else if (filterType === "area" && selectedArea) {
      getMappedTechs(undefined, selectedArea.value).then(res => {
        let arr = [];
        if (res && Array.isArray(res)) arr = res;
        else if (res?.technicians) arr = res.technicians;
        setMappedTechs(
          arr.map((uname: string) => ({
            value: uname,
            label: uname,
          }))
        );
      });
    } else {
      setMappedTechs([]);
    }
  }, [filterType, selectedCategory, selectedArea]);

  // Toggle handler
  const handleToggle = (type: "category" | "area") => {
    setFilterType(type);
    setSelectedCategory(null);
    setSelectedArea(null);
    setMappedTechs([]);
    setSelectedTech(null);
  };

  // Helper to format date/time as "16/02/2026 9:00 AM"
  function formatDateTime(dt: string) {
    if (!dt) return "";
    const d = new Date(dt);
    if (isNaN(d.getTime())) return dt;
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
  }

  // Filtered complaint details for technician, only assigned tasks
  const filteredComplaintDetails = workHistoryTech
    ? complaintDetails.filter(
        detail =>
          (detail.assigned_to || "").toLowerCase() === workHistoryTech.value.toLowerCase() &&
          (detail.status || "").toLowerCase() === "assigned"
      )
    : complaintDetails.filter(
        detail => (detail.status || "").toLowerCase() === "assigned"
      );

  return (
<div className="flex flex-col lg:flex-row gap-8">
      {/* Left: Filter and mapping */}
      <div className="w-full md:w-2/3 lg:w-1/3 bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-bold mb-4">Technician Settings</h2>
        {/* Toggle Switch */}
        <div className="flex w-64 mb-6 rounded overflow-hidden border border-blue-600">
          <button
            className={`flex-1 py-2 font-semibold transition-colors ${
              filterType === "category"
                ? "bg-blue-600 text-white"
                : "bg-white text-blue-600"
            }`}
            onClick={() => handleToggle("category")}
          >
            Category
          </button>
          <button
            className={`flex-1 py-2 font-semibold transition-colors ${
              filterType === "area"
                ? "bg-blue-600 text-white"
                : "bg-white text-blue-600"
            }`}
            onClick={() => handleToggle("area")}
          >
            Area
          </button>
        </div>
        <h3 className="text-md font-bold mb-2">
          {filterType === "category" ? "Categories" : "Areas"}
        </h3>
        <Select
          options={filterType === "category" ? categories : areas}
          value={filterType === "category" ? selectedCategory : selectedArea}
          onChange={filterType === "category" ? setSelectedCategory : setSelectedArea}
          isClearable
          isSearchable
          placeholder={`Select ${filterType === "category" ? "Category" : "Area"}`}
          classNamePrefix="react-select"
        />
        <div className="mt-4 rounded-lg overflow-hidden border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 uppercase text-xs text-gray-500 font-bold">
                <th className="py-2 px-3 text-left">S.No</th>
                <th className="py-2 px-3 text-left">{filterType === "category" ? "Category" : "Area"}</th>
                <th className="py-2 px-3 text-left">Technician</th>
              </tr>
            </thead>
            <tbody>
              {(filterType === "category" ? selectedCategory : selectedArea) ? (
                mappedTechs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 px-3 text-center text-gray-400">
                      No technicians mapped.
                    </td>
                  </tr>
                ) : (
                  mappedTechs.map((tech, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-gray-100 transition-colors ${selectedTech?.value === tech.value ? "bg-blue-50" : ""}`}
                      onClick={() => setSelectedTech(tech)}
                      style={{ cursor: "pointer" }}
                    >
                      <td className="py-2 px-3">{idx + 1}</td>
                      <td className="py-2 px-3">
                        {filterType === "category"
                          ? selectedCategory?.label
                          : selectedArea?.label}
                      </td>
                      <td className="py-2 px-3">{tech.label}</td>
                    </tr>
                  ))
                )
              ) : (
                <tr>
                  <td colSpan={3} className="py-4 px-3 text-center text-gray-400">
                    Select a {filterType} to view mapped technicians.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Right: Work History */}
      <TechWorkHistory
        areas={areas}
        areaTechnicians={areaTechnicians}
        workHistoryArea={workHistoryArea}
        setWorkHistoryArea={setWorkHistoryArea}
        workHistoryTech={workHistoryTech}
        setWorkHistoryTech={setWorkHistoryTech}
        filteredComplaintDetails={filteredComplaintDetails}
        categoryMap={categoryMap}
        areaLabel={workHistoryArea ? workHistoryArea.label : undefined}
      />
    </div>
  );
}