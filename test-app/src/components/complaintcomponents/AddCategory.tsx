import React, { useState, useEffect } from "react";
import { AddButton, EditButton, DeleteButton } from "./Buttons";
import { getComplaintCategories, addComplaintCategory, deleteComplaintCategory } from "@/services/Transaction/Contract/Contractapi";

interface Category {
  code: string;
  description: string;
}

export default function AddCategory() {
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch categories from backend
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const res = await getComplaintCategories();
    let arr = [];
    if (res && Array.isArray(res)) arr = res;
    else if (res?.categories) arr = res.categories;
    setCategories(arr.map((cat: any) => ({
      code: cat.comp_cat_code,
      description: cat.comp_cat_desc,
    })));
  };

  // Add new category
  const handleAdd = async () => {
    if (!description.trim()) return;
    setLoading(true);
    // Find max code and increment
    let maxCode = 0;
    categories.forEach(cat => {
      const num = parseInt(cat.code, 10);
      if (!isNaN(num) && num > maxCode) maxCode = num;
    });
    const newCode = (maxCode + 1).toString().padStart(3, "0");
    // Call backend to add
    await addComplaintCategory(newCode, description.trim());
    setDescription("");
    await fetchCategories();
    setLoading(false);
  };

  // Delete category
  const handleDelete = async (code: string) => {
    await deleteComplaintCategory(code);
    await fetchCategories();
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Add form */}
      <div className="bg-white rounded-lg shadow p-3 mb-2">
        <h2 className="text-base font-semibold mb-2">Add Category</h2>
        <div className="flex gap-2">
          <input
            type="text"
            className="border rounded p-1 flex-1 text-sm"
            placeholder="Category Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
          />
          <AddButton onClick={handleAdd} />
        </div>
      </div>
      {/* Category list */}
      {/* <div className="bg-white rounded-lg shadow p-3">
        <h2 className="text-base font-semibold mb-2">Available Categories</h2>
        {categories.length === 0 ? (
          <div className="text-gray-500 text-sm">No categories added yet.</div>
        ) : (
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-1 border">Code</th>
                <th className="p-1 border">Description</th>
                <th className="p-1 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, idx) => (
                <tr key={cat.code}>
                  <td className="p-1 border">{cat.code}</td>
                  <td className="p-1 border">{cat.description}</td>
                  <td className="p-1 border">
                    <DeleteButton onClick={() => handleDelete(cat.code)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div> */}
    </div>
  );
}