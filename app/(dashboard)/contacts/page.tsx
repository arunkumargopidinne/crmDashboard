"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  useContacts,
  useDeleteContact,
  useBulkDeleteContacts,
} from "@/hooks/useContacts";
import { useTags } from "@/hooks/useTags";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Upload,
  Trash2,
  Edit,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Grid,
  List,
} from "lucide-react";
import { AddContactModal } from "@/components/contacts/AddContactModal";
import { CSVImportModal } from "@/components/contacts/CSVImportModal";
import { useDebounce } from "@/hooks/useDebounce";

export default function ContactsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(
    new Set()
  );
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const debouncedSearch = useDebounce(search, 500);
  const { data, isLoading } = useContacts(page, 10, debouncedSearch, selectedTags);
  const { data: tagsData } = useTags();
  const deleteContact = useDeleteContact();
  const bulkDelete = useBulkDeleteContacts();

  const contacts = data?.data || [];
  const pagination = data?.pagination;
  const tags = tagsData || [];

  // Handle contact deletion
  const handleDeleteContact = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      await deleteContact.mutateAsync(id);
    } catch (error) {
      alert("Failed to delete contact");
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedContacts.size === 0) return;
    if (
      !confirm(
        `Delete ${selectedContacts.size} contact(s)? This cannot be undone.`
      )
    )
      return;

    try {
      await bulkDelete.mutateAsync(Array.from(selectedContacts));
      setSelectedContacts(new Set());
    } catch (error) {
      alert("Failed to delete contacts");
    }
  };

  // Toggle contact selection
  const toggleContact = (id: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedContacts(newSelected);
  };

  // Select all visible contacts
  const toggleSelectAll = () => {
    if (selectedContacts.size === contacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(contacts.map((c) => c._id)));
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">
            Manage all your customer relationships in one place
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Action Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-md:center justify-between">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search by name, email, company..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tag Filter */}
          {tags.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <select
                multiple
                value={selectedTags}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, (opt) =>
                    opt.value
                  );
                  setSelectedTags(selected);
                  setPage(1);
                }}
                className="text-sm border border-gray-300 rounded-lg p-2 max-w-xs"
              >
                {tags.map((tag) => (
                  <option key={tag._id} value={tag._id}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Bulk Action Bar */}
      {selectedContacts.size > 0 && (
        <Card className="p-4 bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-blue-900">
              {selectedContacts.size} contact(s) selected
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="sm">
                Add Tag
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkDelete.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Contacts Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">No contacts found</p>
          <Button onClick={() => setShowAddModal(true)}>
            Create your first contact
          </Button>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedContacts.size === contacts.length &&
                        contacts.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="rounded cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contacts.map((contact) => (
                  <tr
                    key={contact._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedContacts.has(contact._id)}
                        onChange={() => toggleContact(contact._id)}
                        className="rounded cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {contact.name}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{contact.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">
                        {contact.company || "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 flex-wrap">
                        {contact.tags.map((tag) => (
                          <span
                            key={tag._id}
                            className="px-2 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link href={`/contacts/${contact._id}`}>
                          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(contact._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing page {pagination.page} of {pagination.pages} (
                {pagination.total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {[...Array(pagination.pages)].map((_, i) => (
                  <Button
                    key={i + 1}
                    variant={page === i + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage(Math.min(pagination.pages, page + 1))
                  }
                  disabled={page === pagination.pages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <AddContactModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
      <CSVImportModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
    </div>
  );
}
