import React, { useEffect, useState } from "react";
import Select from "react-select";
import { SaveButton, DeleteButton, AddButton } from "./Buttons";
import AddCategory from "./AddCategory";
import Modal from "react-modal";
import {
  getComplaintCategories,
  getUserLists,
  addTechnicians,
  addCatTech,
  getCatTechnicians,
  deleteTechnicianFromUser,
  deleteCatTech,
  getAreas
} from "@/services/Transaction/Contract/Contractapi";

export default function TechCatMap() {
  // First container states
  const [users, setUsers] = useState<{ value: string; label: string; checked: boolean }[]>([]);
  const [selectedUser, setSelectedUser] = useState<any[]>([]);
  const [userTable, setUserTable] = useState<{ value: string; label: string; checked: boolean }[]>([]);

  // Second container states
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [technicians, setTechnicians] = useState<{ value: string; label: string; checked: boolean }[]>([]);
  const [selectedTechs, setSelectedTechs] = useState<any[]>([]);
  const [catMappedTechs, setCatMappedTechs] = useState<any[]>([]);
  const [selectedCode, setSelectedCode] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);

  // Area selection states
  const [areaOptions, setAreaOptions] = useState<any[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<any[]>([]);

  useEffect(() => {
    getUserLists(0).then((res) => {
      let arr = [];
      if (res && Array.isArray(res)) arr = res;
      else if (res?.users) arr = res.users;
      const mapped = arr.map((user: any) => ({
        value: user.Uname || user.username || user.value,
        label: user.Uname || user.username || user.label,
        checked: false,
      }));
      setUsers(mapped);
    });

    getComplaintCategories().then((res) => {
      let arr = [];
      if (res && Array.isArray(res)) arr = res;
      else if (res?.categories) arr = res.categories;
     setCategories(arr.map((cat: any) => ({
      value: cat.sscode,
      label: cat.sdescr,
    })));
    });

    getUserLists(1).then((res) => {
      let arr = [];
      if (res && Array.isArray(res)) arr = res;
      else if (res?.users) arr = res.users;
      const mapped = arr.map((tech: any) => ({
        value: tech.Uname,
        label: tech.Uname,
        checked: false,
      }));
      setUserTable(mapped);
      setTechnicians(mapped);
    });

    getAreas().then((res) => {
      let arr = [];
      if (res && Array.isArray(res)) arr = res;
      else if (res?.areas) arr = res.areas;
      setAreaOptions(
        arr.map((area: any) => ({
          value: area.area_id || area.value || area.code,
          label: area.area_desc || area.label || area.name,
        }))
      );
    });
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      getCatTechnicians(selectedCategory.value).then(res => {
        let arr = [];
        if (res && Array.isArray(res)) arr = res;
        else if (res?.technicians) arr = res.technicians;
        const mapped = arr.map((tech: any) => ({
          value: tech.uname,
          label: tech.uname,
          checked: false,
          areas: tech.areas || [],
        }));
        setCatMappedTechs(mapped);
      });
    } else {
      setCatMappedTechs([]);
    }
  }, [selectedCategory]);

  const technicianDropdownOptions = React.useMemo(() => {
    if (!selectedCategory) return technicians;
    const mappedValues = catMappedTechs.map(t => t.value);
    return technicians.filter(t => !mappedValues.includes(t.value));
  }, [technicians, selectedCategory, catMappedTechs]);

  useEffect(() => {
    if (selectedCode && categories.length > 0) {
      const found = categories.find(cat => cat.value === selectedCode.value);
      if (
        found &&
        (!selectedCategory || selectedCategory.value !== found.value)
      ) {
        setSelectedCategory(found);
      }
    }
    if (!selectedCode && selectedCategory) {
      setSelectedCategory(null);
    }
  }, [selectedCode, categories]);

  useEffect(() => {
    if (selectedCategory && categories.length > 0) {
      const found = categories.find(cat => cat.label === selectedCategory.label);
      if (
        found &&
        (!selectedCode || selectedCode.value !== found.value)
      ) {
        setSelectedCode({ value: found.value, label: found.value });
      }
    }
    if (!selectedCategory && selectedCode) {
      setSelectedCode(null);
    }
  }, [selectedCategory, categories]);

  const handleTechCheck = (selected: any) => {
    setSelectedTechs(selected || []);
  };

  const handleUserCheck = (idx: number) => {
    setUserTable(prev =>
      prev.map((user, i) =>
        i === idx ? { ...user, checked: !user.checked } : user
      )
    );
  };

  const handleUserDelete = async () => {
    const toDelete = userTable.filter(u => u.checked);
    for (const user of toDelete) {
      await deleteTechnicianFromUser(user.value);
    }
    getUserLists(1).then((res) => {
      let arr = [];
      if (res && Array.isArray(res)) arr = res;
      else if (res?.users) arr = res.users;
      const mapped = arr.map((tech: any) => ({
        value: tech.Uname,
        label: tech.Uname,
        checked: false,
      }));
      setUserTable(mapped);
      setTechnicians(mapped);
    });
  };

  const handleCatTechCheck = (idx: number) => {
    setCatMappedTechs(prev =>
      prev.map((tech, i) =>
        i === idx ? { ...tech, checked: !tech.checked } : tech
      )
    );
  };

  const handleCatTechDelete = async () => {
    if (!selectedCategory) return;
    const toDelete = catMappedTechs.filter(t => t.checked);
    for (const tech of toDelete) {
      await deleteCatTech(selectedCategory.value, tech.value);
    }
    getCatTechnicians(selectedCategory.value).then(res => {
      let arr = [];
      if (res && Array.isArray(res)) arr = res;
      else if (res?.technicians) arr = res.technicians;
      const mapped = arr.map((tech: any) => ({
        value: tech.uname,
        label: tech.uname,
        checked: false,
        areas: tech.areas || [],
      }));
      setCatMappedTechs(mapped);
    });
  };

  const handleAreaCheck = (selected: any) => {
    setSelectedAreas(selected || []);
  };

  const handleAddCatTechArea = async () => {
    if (
      selectedCategory &&
      selectedTechs.length > 0 &&
      selectedAreas.length > 0
    ) {
      const userid = sessionStorage.getItem("username") || "";
      const technicians = selectedTechs.map((t: any) => ({ Uname: t.value }));
      const area_ids = selectedAreas.map((a: any) => a.value);
      const cat_id = selectedCategory.value;
      await addCatTech(area_ids, userid, technicians, cat_id);
      setSelectedAreas([]);
      setSelectedTechs([]);
      if (area_ids.length > 0) {
        getCatTechnicians(selectedCategory.value).then((res) => {
          let arr = [];
          if (res && Array.isArray(res)) arr = res;
          else if (res?.technicians) arr = res.technicians;
          const mapped = arr.map((tech: any) => ({
            value: tech.uname,
            label: tech.uname,
            checked: false,
            areas: tech.areas || [],
          }));
          setCatMappedTechs(mapped);
        });
      }
    }
  };

  // --- Modern Table Styles ---
  const tableHeaderClass = "px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50";
  const tableCellClass = "px-3 py-2 text-center text-gray-700 whitespace-nowrap";
  const tableRowClass = "hover:bg-gray-50 transition";
  const tableBorderless = "border-separate border-spacing-0 w-full";

  return (
    <div className="flex gap-8">
      {/* First container */}
      <div className="flex-1 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4">Technician List</h2>
        <div className="flex items-end gap-4 mb-4">
          <div className="flex-1">
            <Select
              options={users}
              value={selectedUser}
              onChange={val => setSelectedUser(Array.isArray(val) ? [...val] : [])}
              isMulti
              isClearable
              isSearchable
              closeMenuOnSelect={false}
              placeholder="User(s)"
              hideSelectedOptions={false}
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>
          <AddButton
            onClick={async () => {
              if (selectedUser.length > 0) {
                const techs = selectedUser.map((u: any) => ({ Uname: u.value }));
                const res = await addTechnicians(techs);
                if (res.success) {
                  getUserLists(1).then((res) => {
                    let arr = [];
                    if (res && Array.isArray(res)) arr = res;
                    else if (res?.users) arr = res.users;
                    const mapped = arr.map((tech: any) => ({
                      value: tech.Uname,
                      label: tech.Uname,
                      checked: false,
                      areas: tech.areas || [],
                    }));
                    setUserTable(mapped);
                    setTechnicians(mapped);
                  });
                  setSelectedUser([]);
                }
              }
            }}
          />
          <DeleteButton onClick={handleUserDelete} />
        </div>
        <div className="w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm">
  <div style={{ maxHeight: 350, overflowY: 'auto' }}>
    <table className={tableBorderless}>
      <thead>
        <tr>
          <th className={tableHeaderClass + " w-12 text-center"}>S.No</th>
          <th className={tableHeaderClass + " w-16 text-center"}>Select</th>
          <th className={tableHeaderClass}>Available Technician</th>
        </tr>
      </thead>
      <tbody>
        {userTable.length === 0 ? (
          <tr>
            <td colSpan={3} className="text-center text-gray-400 py-4">No technicians found.</td>
          </tr>
        ) : (
          userTable.map((u, idx) => (
            <tr key={u.value} className={tableRowClass}>
              <td className={tableCellClass + " text-center"}>{idx + 1}</td>
              <td className={tableCellClass + " text-center"}>
                <input
                  type="checkbox"
                  checked={u.checked}
                  onChange={() => handleUserCheck(idx)}
                />
              </td>
              <td className={tableCellClass}>{u.label}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
</div>
      </div>
      {/* Second container */}
      <div className="flex-1 bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Category/Technician Mapping</h2>
          <button
            className="px-3 py-1 bg-blue-600 text-white rounded"
            onClick={() => setShowAddCategory(true)}
          >
            Add Category
          </button>
        </div>
        {/* Row 1: Code & Category */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 flex flex-col">
            <span className="text-xs text-gray-500 mb-1">Select Code</span>
            <Select
              options={categories.map(cat => ({
                value: cat.value,
                label: cat.value,
              }))}
              value={selectedCode}
              onChange={setSelectedCode}
              isClearable
              isSearchable
              placeholder="Code"
            />
          </div>
          <div className="flex-1 flex flex-col">
            <span className="text-xs text-gray-500 mb-1">Select Category</span>
            <Select
              options={categories}
              value={selectedCategory}
              onChange={setSelectedCategory}
              isClearable
              isSearchable
              placeholder="Category"
            />
          </div>
        </div>
        {/* Row 2: Technician multi-select dropdown */}
        <div className="flex items-end gap-4 mb-4">
          <div className="flex-1 flex flex-col">
            <span className="text-xs text-gray-500 mb-1">Select Technicians</span>
            <Select
              options={technicianDropdownOptions}
              value={selectedTechs}
              onChange={handleTechCheck}
              isMulti
              isSearchable
              closeMenuOnSelect={false}
              placeholder="Search and select technicians..."
              hideSelectedOptions={false}
              className="react-select-container"
              classNamePrefix="react-select"
              isDisabled={!selectedCategory}
            />
          </div>
        </div>
        {/* Row 3: Area multi-select dropdown, Add, Delete */}
       <div className="mb-2">
  <div className="flex flex-col">
    <span className="text-xs text-gray-500 mb-1">Select Areas</span>
    <Select
      options={areaOptions}
      value={selectedAreas}
      onChange={handleAreaCheck}
      isMulti
      isSearchable
      closeMenuOnSelect={false}
      placeholder="Search and select areas..."
      hideSelectedOptions={false}
      className="react-select-container"
      classNamePrefix="react-select"
      isDisabled={selectedTechs.length === 0}
    />
  </div>
  <div className="flex gap-4 mt-2">
    <AddButton onClick={handleAddCatTechArea} />
    <DeleteButton onClick={handleCatTechDelete} />
  </div>
</div>
        <div className="w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm" style={{ maxHeight: 400, overflowY: "auto" }}>
          <table className={tableBorderless}>
            <thead>
              <tr>
                <th className={tableHeaderClass + " w-12 text-center"}>S.No</th>
                <th className={tableHeaderClass + " w-16 text-center"}>Select</th>
                <th className={tableHeaderClass}>Technician</th>
                <th className={tableHeaderClass}>Available Locations</th>
              </tr>
            </thead>
            <tbody>
              {selectedCategory ? (
                catMappedTechs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-400 py-4">
                      No technicians mapped for this category.
                    </td>
                  </tr>
                ) : (
                  catMappedTechs.map((row: any, idx: number) => (
                    <tr key={row.value} className={tableRowClass}>
                      <td className={tableCellClass + " text-center"}>{idx + 1}</td>
                      <td className={tableCellClass + " text-center"}>
                        <input
                          type="checkbox"
                          checked={row.checked}
                          onChange={() => handleCatTechCheck(idx)}
                        />
                      </td>
                      <td className={tableCellClass}>{row.label}</td>
                      <td className={tableCellClass}>
                        <div className="flex flex-wrap gap-1">
                          {row.areas && row.areas.length > 0 ? (
                            row.areas.map((area: any) => (
                              <span
                                key={area.area_id}
                                className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                              >
                                {area.area_desc}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-xs">No locations</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-4">
                    Select the category to see the technicians.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Add Category Modal */}
        <Modal
          isOpen={showAddCategory}
          onRequestClose={() => setShowAddCategory(false)}
          contentLabel="Add Category"
          ariaHideApp={false}
          style={{
            content: {
              maxWidth: "500px",
              width: "90%",
              margin: "auto",
              borderRadius: "10px",
              padding: "0",
              overflow: "visible",
              top: "50%",
              left: "50%",
              right: "auto",
              bottom: "auto",
              transform: "translate(-50%, -50%)",
              boxShadow: "0 2px 16px rgba(0,0,0,0.15)"
            }
          }}
        >
          <div className="p-3">
            <button
              className="float-right text-gray-500 hover:text-gray-700"
              onClick={() => setShowAddCategory(false)}
            >
              &times;
            </button>
            <AddCategory />
          </div>
        </Modal>
      </div>
    </div>
  );
}