"use client";

import * as React from "react";
import { Upload, X, Plus, Image, FileText, Book, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";
import { isApiError } from "@/lib/utils";
import type { Portfolio, PortfolioContentType, PortfolioContentItem } from "@/types";

interface ContentItem {
  id: string;
  type: PortfolioContentType;
  file?: File;
  url?: string;
  title: string;
  audiobookId?: string | undefined;
}

interface PortfolioFormProps {
  portfolioId?: string;
  studentId: string;
  initialData?: Portfolio;
  onSuccess: () => void;
  onCancel: () => void;
}

const contentTypeOptions = [
  { value: "IMAGE", label: "Image" },
  { value: "PDF", label: "PDF Document" },
];

export function PortfolioForm({
  portfolioId,
  studentId,
  initialData,
  onSuccess,
  onCancel,
}: PortfolioFormProps) {
  const [title, setTitle] = React.useState(initialData?.title || "");
  const [coverImage, setCoverImage] = React.useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = React.useState<string | null>(
    initialData?.coverImage || initialData?.coverUrl || null
  );

  // Normalize content items from either API format
  const normalizeContentItems = React.useCallback((): ContentItem[] => {
    const items = initialData?.contentItems || initialData?.contents || [];
    return items.map((item) => ({
      id: item.id,
      type: item.type,
      url: item.url || item.fileUrl || "",
      title: item.title || item.name || "",
      audiobookId: item.audioBookEditionId,
    }));
  }, [initialData]);

  const [contentItems, setContentItems] = React.useState<ContentItem[]>(normalizeContentItems());
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const coverImageInputRef = React.useRef<HTMLInputElement>(null);

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddContentItem = () => {
    setContentItems((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        type: "IMAGE" as PortfolioContentType,
        title: "",
      },
    ]);
  };

  const handleRemoveContentItem = (id: string) => {
    setContentItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleContentItemChange = (
    id: string,
    field: keyof ContentItem,
    value: string | File | PortfolioContentType
  ) => {
    setContentItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleContentFileChange = (id: string, file: File | null) => {
    if (file) {
      setContentItems((prev) => prev.map((item) => (item.id === id ? { ...item, file } : item)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("coverComponents", JSON.stringify({})); // Empty object for now

      if (coverImage) {
        formData.append("cover", coverImage);
      }

      // Build content array for backend API
      const contentArray = contentItems.map((item, index) => ({
        id: item.id.startsWith("new-") ? undefined : item.id,
        type: item.type,
        order: index,
        name: item.title || undefined,
        fileTempId: item.file ? `temp-${index}` : undefined,
        fileUrl: item.url || undefined,
        audioBookEditionId: item.audiobookId || undefined,
        isNew: item.id.startsWith("new-") || !!item.file,
      }));

      formData.append("content", JSON.stringify(contentArray));

      // Add files with matching temp IDs
      contentItems.forEach((item, index) => {
        if (item.file) {
          formData.append(`file_temp-${index}`, item.file);
        }
      });

      if (portfolioId) {
        // Add portfolio id for update
        formData.append("id", portfolioId);
        await api.updatePortalPortfolio(studentId, portfolioId, formData);
      } else {
        await api.createPortalPortfolio(studentId, formData);
      }

      onSuccess();
    } catch (err) {
      console.error("Failed to save portfolio:", err);
      setError(isApiError(err) ? err.message : "Failed to save portfolio");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getContentIcon = (type: PortfolioContentType) => {
    switch (type) {
      case "IMAGE":
        return Image;
      case "PDF":
        return FileText;
      default:
        return FileText;
    }
  };

  const getDisplayFileName = (url: string, maxLength: number = 30): string => {
    // Extract filename from URL
    const fileName = url.split('/').pop() || url;

    // Remove file extension
    const lastDotIndex = fileName.lastIndexOf('.');
    const nameWithoutExt = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;

    // Truncate if too long
    if (nameWithoutExt.length > maxLength) {
      return nameWithoutExt.substring(0, maxLength) + '...';
    }

    return nameWithoutExt;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter portfolio title"
            required
          />

          {/* Cover Image */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Cover Image</label>
            <div className="mt-1 flex items-center gap-4">
              {coverImagePreview ? (
                <div className="relative">
                  <img
                    src={coverImagePreview}
                    alt="Cover preview"
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCoverImage(null);
                      setCoverImagePreview(null);
                    }}
                    className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => coverImageInputRef.current?.click()}
                  className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400"
                >
                  <Upload className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <input
                ref={coverImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverImageChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => coverImageInputRef.current?.click()}
              >
                {coverImagePreview ? "Change Image" : "Upload Image"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Content Items</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={handleAddContentItem}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {contentItems.length === 0 ? (
            <p className="text-center text-sm text-gray-500">
              No content items yet. Click "Add Item" to add content.
            </p>
          ) : (
            contentItems.map((item, index) => {
              const Icon = getContentIcon(item.type);
              return (
                <div key={item.id} className="rounded-lg border p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                      <Icon className="h-5 w-5 text-gray-500" />
                    </div>

                    <div className="flex-1 space-y-3">
                      {/* File Type Selection */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                          File Type
                        </label>
                        <Select
                          options={contentTypeOptions}
                          value={item.type}
                          onChange={(e) =>
                            handleContentItemChange(
                              item.id,
                              "type",
                              e.target.value as PortfolioContentType
                            )
                          }
                          className="w-full"
                        />
                      </div>

                      {/* Title */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                          Title (optional)
                        </label>
                        <Input
                          placeholder={`Enter ${item.type.toLowerCase()} title`}
                          value={item.title}
                          onChange={(e) => handleContentItemChange(item.id, "title", e.target.value)}
                        />
                      </div>

                      {/* File Upload */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                          File
                        </label>
                        {item.url && !item.file ? (
                          <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-gray-50 px-3 py-2">
                            <FileText className="h-4 w-4 flex-shrink-0 text-gray-400" />
                            <span className="flex-1 text-sm text-gray-600" title={item.url}>
                              {getDisplayFileName(item.url)}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleContentItemChange(item.id, "url", "")}
                            >
                              Change
                            </Button>
                          </div>
                        ) : (
                          <>
                            <input
                              type="file"
                              accept={item.type === "IMAGE" ? "image/*" : "application/pdf"}
                              onChange={(e) =>
                                handleContentFileChange(item.id, e.target.files?.[0] || null)
                              }
                              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-orange-700 hover:file:bg-orange-100"
                            />
                            {item.file && (
                              <p className="mt-1 text-xs text-gray-500" title={item.file.name}>
                                Selected: {getDisplayFileName(item.file.name, 40)}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0"
                      onClick={() => handleRemoveContentItem(item.id)}
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {portfolioId ? "Update Portfolio" : "Create Portfolio"}
        </Button>
      </div>
    </form>
  );
}
