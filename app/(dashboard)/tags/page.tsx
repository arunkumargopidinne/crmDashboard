"use client";

import React, { useState } from "react";
import { useTags } from "@/hooks/useTags";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2 } from "lucide-react";

export default function TagsPage() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", color: "#3B82F6" });
  const { data: tags = [], isLoading } = useTags();

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      setFormData({ name: "", color: "#3B82F6" });
      setShowForm(false);
    } catch (error: any) {
      alert(error.message || "Failed to create tag");
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tags</h1>
          <p className="text-gray-600 mt-1">
            Organize and categorize your contacts
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Tag
        </Button>
      </div>

      {/* Add Tag Form */}
      {showForm && (
        <Card className="p-6">
          <form onSubmit={handleAddTag} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tag Name
              </label>
              <Input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., VIP, Prospect, Lead"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className="w-20 h-10 rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ name: "", color: "#3B82F6" });
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Create Tag</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tags Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : tags.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600">No tags created yet</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tags.map((tag) => (
            <Card key={tag._id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  ></div>
                  <div>
                    <p className="font-semibold text-gray-900">{tag.name}</p>
                    <p className="text-xs text-gray-600">Created recently</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
