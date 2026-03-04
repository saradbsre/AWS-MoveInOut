import React, { useState, useEffect } from "react";
import Select from "react-select";
import { SaveButton } from "./Buttons";
import { getComplaintCategories } from "@/services/Transaction/Contract/Contractapi";

// Dummy data for technicians and areas
const technicians = [
  { code: "T001", name: "John" },
  { code: "T002", name: "Jane" },
];
const areas = [
  { code: "A001", name: "Lobby" },
  { code: "A002", name: "Parking" },
];
const properties = [
  "B001", "B002", "B003", "B004", "B005", "B006", "B02"
];

export default function AreaCatMap() {
  const [mode, setMode] = useState<"technician" | "area">("technician");
  const [selectedTech, setSelectedTech] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [categories, setCategories] = useState<{ comp_cat_code: string; comp_cat_desc: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedCode, setSelectedCode] = useState<any>(null);
  const [leftList, setLeftList] = useState<string[]>([]);
  const [rightList, setRightList] = useState<string[]>(properties);
  const [selectedLeft, setSelectedLeft] = useState<string[]>([]);
  const [selectedRight, setSelectedRight] = useState<string[]>([]);

  // Fetch categories from API
  useEffect(() => {
    getComplaintCategories().then((res) => {
      if (res && Array.isArray(res)) setCategories(res);
      else if (res?.categories) setCategories(res.categories);
    });
  }, []);

  // Reset lists and selections when mode changes
  useEffect(() => {
    setLeftList([]);
    setRightList(properties);
    setSelectedLeft([]);
    setSelectedRight([]);
    setSelectedTech("");
    setSelectedArea("");
    setSelectedCategory(null);
    setSelectedCode(null);
  }, [mode, categories]);

  // When code is selected, auto-select corresponding category
useEffect(() => {
  if (selectedCode && categories.length > 0) {
    const found = categories.find(
      (cat) => cat.comp_cat_code === selectedCode.value
    );
    if (
      found &&
      (!selectedCategory ||
        selectedCategory.value !== found.comp_cat_code)
    ) {
      setSelectedCategory({
        value: found.comp_cat_code,
        label: found.comp_cat_desc,
      });
    }
  }
  // If code is cleared, also clear category
  if (!selectedCode && selectedCategory) {
    setSelectedCategory(null);
  }
  // eslint-disable-next-line
}, [selectedCode, categories]);

  // When category is selected, auto-select corresponding code
useEffect(() => {
  if (selectedCategory && categories.length > 0) {
    const found = categories.find(
      (cat) => cat.comp_cat_desc === selectedCategory.label
    );
    if (
      found &&
      (!selectedCode || selectedCode.value !== found.comp_cat_code)
    ) {
      setSelectedCode({
        value: found.comp_cat_code,
        label: found.comp_cat_code,
      });
    }
  }
  // If category is cleared, also clear code
  if (!selectedCategory && selectedCode) {
    setSelectedCode(null);
  }
  // eslint-disable-next-line
}, [selectedCategory, categories]);

  // Move selected from right to left
  const moveSelectedRightToLeft = () => {
    setLeftList([...leftList, ...selectedRight]);
    setRightList(rightList.filter((item) => !selectedRight.includes(item)));
    setSelectedRight([]);
  };
  // Move selected from left to right
  const moveSelectedLeftToRight = () => {
    setRightList([...rightList, ...selectedLeft]);
    setLeftList(leftList.filter((item) => !selectedLeft.includes(item)));
    setSelectedLeft([]);
  };
  // Move all right to left
  const moveAllRightToLeft = () => {
    setLeftList([...leftList, ...rightList]);
    setRightList([]);
    setSelectedRight([]);
  };
  // Move all left to right
  const moveAllLeftToRight = () => {
    setRightList([...rightList, ...leftList]);
    setLeftList([]);
    setSelectedLeft([]);
  };

  // Save handler
  const handleSave = () => {
    if (mode === "technician") {
      alert(
        `Saved mapping for Code: ${selectedCode?.value}, Category: ${selectedCategory?.label}\nMapped: ${leftList.join(", ")}`
      );
    } else {
      alert(
        `Saved mapping for Area: ${selectedArea}, Technician: ${selectedTech}\nMapped: ${leftList.join(", ")}`
      );
    }
  };

  // Prepare options for react-select
  const codeOptions = categories.map((cat) => ({
    value: cat.comp_cat_code,
    label: cat.comp_cat_code,
  }));
  const categoryOptions = categories.map((cat) => ({
    value: cat.comp_cat_code,
    label: cat.comp_cat_desc,
  }));

  return (
    <div className="p-0 rounded-lg shadow-none max-w-3xl mx-auto">
      {/* Toggle + Save row */}
      <div className="flex items-end gap-2 mb-4">
        <div className="flex rounded-lg overflow-hidden border border-blue-600">
          <button
            className={`px-4 py-2 font-semibold transition-colors ${
              mode === "technician"
                ? "bg-blue-600 text-white"
                : "bg-white text-blue-600"
            }`}
            style={{ minWidth: 140 }}
            onClick={() => setMode("technician")}
            type="button"
          >
            Technician
          </button>
          <button
            className={`px-4 py-2 font-semibold transition-colors ${
              mode === "area"
                ? "bg-blue-600 text-white"
                : "bg-white text-blue-600"
            }`}
            style={{ minWidth: 140 }}
            onClick={() => setMode("area")}
            type="button"
          >
            Area
          </button>
        </div>
        <div className="ml-4">
          <SaveButton onClick={handleSave} />
        </div>
      </div>
      {/* Dropdowns */}
      <div className="flex gap-4 mb-4 items-end">
        {mode === "technician" ? (
          <>
            <div className="flex flex-col flex-1">
              <span className="text-xs text-gray-500 mb-1">Select Code</span>
              <Select
                options={codeOptions}
                value={selectedCode}
                onChange={(val) => setSelectedCode(val)}
                isClearable
                isSearchable
                placeholder="Code"
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-xs text-gray-500 mb-1">Select Category</span>
              <Select
                options={categoryOptions}
                value={selectedCategory}
                onChange={(val) => setSelectedCategory(val)}
                isClearable
                isSearchable
                placeholder="Category"
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col flex-1">
            <span className="text-xs text-gray-500 mb-1">Select Technician</span>
            <Select
              options={technicians.map((t) => ({
                value: t.code,
                label: t.name,
              }))}
              value={
                selectedTech
                  ? {
                      value: selectedTech,
                      label:
                        technicians.find((t) => t.code === selectedTech)?.name ||
                        selectedTech,
                    }
                  : null
              }
              onChange={(val) => setSelectedTech(val ? val.value : "")}
              isClearable
              isSearchable
              placeholder="Technician"
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>
        )}
      </div>
      {/* Mapping system */}
      <div className="flex gap-4 items-start">
        <div className="flex-1">
          <div className="font-semibold mb-1">Technician List</div>
          <select
            multiple
            className="w-full border rounded"
            style={{ height: "240px" }} // 10 rows at 24px each
            value={selectedLeft}
            onChange={(e) =>
              setSelectedLeft(
                Array.from(e.target.selectedOptions, (option) => option.value)
              )
            }
          >
            {leftList.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        {/* Buttons */}
        <div className="flex flex-col gap-2 justify-center pt-8">
          <button
            className="px-2 py-1 border rounded bg-gray-100 hover:bg-gray-200"
            onClick={moveAllRightToLeft}
            type="button"
          >
            &gt;&gt;
          </button>
          <button
            className="px-2 py-1 border rounded bg-gray-100 hover:bg-gray-200"
            onClick={moveSelectedRightToLeft}
            type="button"
          >
            &gt;
          </button>
          <button
            className="px-2 py-1 border rounded bg-gray-100 hover:bg-gray-200"
            onClick={moveSelectedLeftToRight}
            type="button"
          >
            &lt;
          </button>
          <button
            className="px-2 py-1 border rounded bg-gray-100 hover:bg-gray-200"
            onClick={moveAllLeftToRight}
            type="button"
          >
            &lt;&lt;
          </button>
        </div>
        <div className="flex-1">
          <div className="font-semibold mb-1">Technician List</div>
          <select
            multiple
            className="w-full border rounded"
            style={{ height: "240px" }} // 10 rows at 24px each
            value={selectedRight}
            onChange={(e) =>
              setSelectedRight(
                Array.from(e.target.selectedOptions, (option) => option.value)
              )
            }
          >
            {rightList.map((item) => (
              <option key={item} value={item}>
               
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}