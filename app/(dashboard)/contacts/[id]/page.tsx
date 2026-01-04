"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useContact, useUpdateContact, useDeleteContact } from "@/hooks/useContacts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Edit, Trash2, Mail, Phone, Building, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

interface ContactDetailPageProps {
  params: { id: string };
}

export default function ContactDetailPage({
  params,
}: ContactDetailPageProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const { data: contact, isLoading, error } = useContact(params.id);
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  const handleSaveEdit = async () => {
    try {
      await updateContact.mutateAsync({
        id: params.id,
        data: editData,
      });
      setIsEditing(false);
    } catch (error) {
      alert("Failed to update contact");
    }
  };

  const handleDelete = async () => {
    if (
      !confirm("Are you sure you want to delete this contact? This cannot be undone.")
    )
      return;

    try {
      await deleteContact.mutateAsync(params.id);
      router.push("/contacts");
    } catch (error) {
      alert("Failed to delete contact");
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Contact not found
        </div>
        <Link href="/contacts" className="text-blue-600 mt-4 block">
          Back to Contacts
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Back Button */}
      <Link href="/contacts" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
        <ArrowLeft className="w-4 h-4" />
        Back to Contacts
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-blue-600">
              {contact.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            {isEditing ? (
              <input
                type="text"
                value={editData.name}
                onChange={(e) =>
                  setEditData({ ...editData, name: e.target.value })
                }
                className="text-3xl font-bold text-gray-900 border-b-2 border-blue-500"
              />
            ) : (
              <h1 className="text-3xl font-bold text-gray-900">
                {contact.name}
              </h1>
            )}
            <p className="text-gray-600 mt-1">{contact.email}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(true);
                  setEditData(contact);
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={updateContact.isPending}>
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Basic Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) =>
                    setEditData({ ...editData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              ) : (
                <div className="flex items-center gap-2 text-gray-900">
                  <Mail className="w-4 h-4 text-gray-600" />
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editData.phone || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              ) : (
                <div className="flex items-center gap-2 text-gray-900">
                  <Phone className="w-4 h-4 text-gray-600" />
                  {contact.phone || "—"}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.company || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, company: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              ) : (
                <div className="flex items-center gap-2 text-gray-900">
                  <Building className="w-4 h-4 text-gray-600" />
                  {contact.company || "—"}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Created
              </label>
              <div className="flex items-center gap-2 text-gray-900">
                <Calendar className="w-4 h-4 text-gray-600" />
                {new Date(contact.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </Card>

        {/* Tags */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
          {contact.tags.length === 0 ? (
            <p className="text-gray-600">No tags assigned</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {contact.tags.map((tag: any) => (
                <span
                  key={tag._id}
                  className="px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Notes */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
        {isEditing ? (
          <textarea
            value={editData.notes || ""}
            onChange={(e) =>
              setEditData({ ...editData, notes: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows={4}
          />
        ) : (
          <p className="text-gray-700 whitespace-pre-wrap">
            {contact.notes || "No notes"}
          </p>
        )}
      </Card>
    </div>
  );
}
