"use client";

import React, { useState } from "react";
import { useCreateContact } from "@/hooks/useContacts";
import { useTags } from "@/hooks/useTags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface AddContactModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddContactModal({ open, onClose }: AddContactModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
    tags: [] as string[],
  });

  const { mutateAsync: createContact, isPending } = useCreateContact();
  const { data: tags = [] } = useTags();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      alert("Name and email are required");
      return;
    }

    try {
      await createContact(formData);
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        notes: "",
        tags: [],
      });
      onClose();
    } catch (error: any) {
      alert(error.message || "Failed to create contact");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">Add Contact</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <Input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <Input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <Input
              type="text"
              value={formData.company}
              onChange={(e) =>
                setFormData({ ...formData, company: e.target.value })
              }
              placeholder="Acme Inc."
            />
          </div>

          {tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="space-y-2">
                {tags.map((tag) => (
                  <label key={tag._id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.tags.includes(tag._id)}
                      onChange={(e) => {
                        const newTags = e.target.checked
                          ? [...formData.tags, tag._id]
                          : formData.tags.filter((t) => t !== tag._id);
                        setFormData({ ...formData, tags: newTags });
                      }}
                      className="rounded"
                    />
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    ></span>
                    <span className="text-sm text-gray-700">{tag.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Add any notes about this contact..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              rows={3}
            ></textarea>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Add Contact"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
