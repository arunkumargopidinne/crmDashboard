"use client";

import React, { useState } from "react";
import Papa from "papaparse";
import { useBulkImportContacts } from "@/hooks/useContacts";
import { Button } from "@/components/ui/button";
import { Upload, X, AlertCircle, CheckCircle } from "lucide-react";

interface CSVImportModalProps {
  open: boolean;
  onClose: () => void;
}

interface ParsedContact {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  tags?: string;
  notes?: string;
}

export function CSVImportModal({ open, onClose }: CSVImportModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [parseResults, setParseResults] = useState<ParsedContact[]>([]);
  const [importResult, setImportResult] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { mutateAsync: bulkImport, isPending } = useBulkImportContacts();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    handleFiles(dropped);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (newFiles: File[]) => {
    // Only CSV files
    const csvFiles = newFiles.filter((f) =>
      f.type === "text/csv" || f.name.endsWith(".csv")
    );

    if (csvFiles.length === 0) {
      alert("Please select CSV files");
      return;
    }

    setFiles(csvFiles);

    // Parse the first CSV file
    Papa.parse(csvFiles[0], {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParseResults(results.data as ParsedContact[]);
        setImportResult(null);
      },
      error: (error) => {
        alert(`Error parsing CSV: ${error.message}`);
      },
    });
  };

  const handleImport = async () => {
    if (parseResults.length === 0) {
      alert("No contacts to import");
      return;
    }

    // Transform parsed data to contact format
    const contacts = parseResults
      .map((row) => ({
        name: row.name || "",
        email: row.email || "",
        phone: row.phone || "",
        company: row.company || "",
        tags: row.tags ? row.tags.split(";").filter((t) => t.trim()) : [],
        notes: row.notes || "",
      }))
      .filter((c) => c.name && c.email); // Only include valid rows

    try {
      const result = await bulkImport(contacts);
      setImportResult(result);
    } catch (error: any) {
      alert(error.message || "Import failed");
    }
  };

  const handleClose = () => {
    setFiles([]);
    setParseResults([]);
    setImportResult(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">Import Contacts</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!importResult ? (
            <>
              {/* Sample Format */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  CSV Format
                </h3>
                <p className="text-sm text-blue-800 font-mono">
                  name,email,phone,company,tags,notes
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  Tags should be separated by semicolons (e.g., "VIP;Priority")
                </p>
              </div>

              {/* File Upload */}
              {!parseResults.length ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900">
                    Drag and drop your CSV file
                  </p>
                  <p className="text-xs text-gray-600 mt-1">or</p>
                  <label>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2">
                      Browse files
                    </button>
                  </label>
                </div>
              ) : (
                <>
                  {/* Preview */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Preview ({parseResults.length} rows)
                    </h3>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">
                              Name
                            </th>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">
                              Email
                            </th>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">
                              Company
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {parseResults.slice(0, 5).map((row, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2">{row.name}</td>
                              <td className="px-4 py-2">{row.email}</td>
                              <td className="px-4 py-2">{row.company}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {parseResults.length > 5 && (
                      <p className="text-xs text-gray-600 mt-2">
                        ...and {parseResults.length - 5} more
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 justify-end pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setParseResults([]);
                        setFiles([]);
                      }}
                    >
                      Choose Different File
                    </Button>
                    <Button onClick={handleImport} disabled={isPending}>
                      {isPending ? "Importing..." : "Import"}
                    </Button>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {/* Results */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {importResult.successCount} contacts imported
                    </p>
                    <p className="text-sm text-gray-600">
                      Successfully added to your contact list
                    </p>
                  </div>
                </div>

                {importResult.failedCount > 0 && (
                  <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-yellow-900">
                        {importResult.failedCount} rows failed
                      </p>
                      {importResult.errors.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {importResult.errors.map((err: any, idx: number) => (
                            <p
                              key={idx}
                              className="text-xs text-yellow-800"
                            >
                              Row {err.rowIndex} ({err.email}): {err.error}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setImportResult(null);
                    setParseResults([]);
                    setFiles([]);
                  }}
                >
                  Import More
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
