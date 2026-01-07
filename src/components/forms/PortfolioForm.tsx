"use client";

import * as React from "react";
import { Upload, X, Plus, Image, FileText, Book, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";
import type { Portfolio, PortfolioContentType } from "@/types";

interface ContentItem {
  id: string;
  type: PortfolioContentType;
  file?: File;
  url?: string;
  title: string;
  audiobookId?: string;
}

interface PortfolioFormProps {
  portfolioId?: string;
  profileId: string;
  initialData?: Portfolio;
  onSuccess: () => void;
  onCancel: () => void;
}

const contentTypeOptions = [
  { value: "IMAGE", label: "Image" },
  { value: "PDF", label: "PDF Document" },
  { value: "AUDIOBOOK", label: "Audiobook" },
];

export function PortfolioForm({
  portfolioId,
  profileId,
  initialData,
  onSuccess,
  onCancel,
}: PortfolioFormProps) {
  const [title, setTitle] = React.useState(initialData?.title || "");
  const [coverImage, setCoverImage] = React.useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = React.useState<string | null>(
    initialData?.coverImage || null
  );
  const [contentItems, setContentItems] = React.useState<ContentItem[]>(
    initialData?.contentItems?.map((item) => ({
      id: item.id,
      type: item.type,
      url: item.url,
      title: item.title || "",
    })) || []
  );
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
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleContentFileChange = (id: string, file: File | null) => {
    if (file) {
      setContentItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, file } : item))
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("profileId", profileId);

      if (coverImage) {
        formData.append("coverImage", coverImage);
      }

      // Add content items
      contentItems.forEach((item, index) => {
        formData.append(`contentItems[${index}][type]`, item.type);
        formData.append(`contentItems[${index}][title]`, item.title);

        if (item.file) {
          formData.append(`contentItems[${index}][file]`, item.file);
        }

        if (item.audiobookId) {
          formData.append(`contentItems[${index}][audiobookId]`, item.audiobookId);
        }
      });

      if (portfolioId) {
        await api.updatePortfolio(portfolioId, formData);
      } else {
        await api.createPortfolio(formData);
      }

      onSuccess();
    } catch (err) {
      console.error("Failed to save portfolio:", err);
      setError(err instanceof Error ? err.message : "Failed to save portfolio");
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
      case "AUDIOBOOK":
        return Book;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

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
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Cover Image
            </label>
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
                <div
                  key={item.id}
                  className="flex items-start gap-4 rounded-lg border p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    <Icon className="h-5 w-5 text-gray-500" />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex gap-4">
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
                        className="w-40"
                      />
                      <Input
                        placeholder="Item title (optional)"
                        value={item.title}
                        onChange={(e) =>
                          handleContentItemChange(item.id, "title", e.target.value)
                        }
                        className="flex-1"
                      />
                    </div>

                    {item.type !== "AUDIOBOOK" && (
                      <div>
                        {item.url && !item.file ? (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="truncate">{item.url}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleContentItemChange(item.id, "url", "")
                              }
                            >
                              Change
                            </Button>
                          </div>
                        ) : (
                          <input
                            type="file"
                            accept={item.type === "IMAGE" ? "image/*" : ".pdf"}
                            onChange={(e) =>
                              handleContentFileChange(
                                item.id,
                                e.target.files?.[0] || null
                              )
                            }
                            className="text-sm"
                          />
                        )}
                        {item.file && (
                          <p className="mt-1 text-sm text-gray-500">
                            Selected: {item.file.name}
                          </p>
                        )}
                      </div>
                    )}

                    {item.type === "AUDIOBOOK" && (
                      <Input
                        placeholder="Audiobook ID"
                        value={item.audiobookId || ""}
                        onChange={(e) =>
                          handleContentItemChange(
                            item.id,
                            "audiobookId",
                            e.target.value
                          )
                        }
                      />
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveContentItem(item.id)}
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
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
