"use client";

import { useState, useRef, useEffect } from "react";
import { CommunityPostType, SOSCategory } from "@prisma/client";
import { X, Globe, Users, MessageSquare, MapPin, Lightbulb, AlertTriangle, Home, DollarSign, Heart, Shield, FileText, HelpCircle, ChevronUp, ChevronDown, ChevronsUpDown, Image as ImageIcon } from "lucide-react";

type PostComposerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  circleId?: string;
  circleName?: string;
  onPostCreated?: () => void;
  initialType?: CommunityPostType;
  allowGlobal?: boolean;
};

export default function PostComposerModal({
  isOpen,
  onClose,
  circleId,
  circleName,
  onPostCreated,
  initialType,
  allowGlobal = true,
}: PostComposerModalProps) {
  const [postType, setPostType] = useState<CommunityPostType>(
    initialType || CommunityPostType.GENERAL
  );
  const [content, setContent] = useState("");
  const [sosCategory, setSosCategory] = useState<SOSCategory | "">("");
  const [sosUrgency, setSosUrgency] = useState<1 | 2 | 3>(3);
  const [meetupLocation, setMeetupLocation] = useState("");
  const [meetupDate, setMeetupDate] = useState("");
  const [meetupTime, setMeetupTime] = useState("");
  const [gyaanTitle, setGyaanTitle] = useState("");
  const [gyaanCategory, setGyaanCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGlobal, setIsGlobal] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialType) {
      setPostType(initialType);
    }
  }, [initialType]);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setContent("");
      setSosCategory("");
      setSosUrgency(3);
      setMeetupLocation("");
      setMeetupDate("");
      setMeetupTime("");
      setGyaanTitle("");
      setGyaanCategory("");
      setImages([]);
      setIsGlobal(false);
      setError(null);
    }
  }, [isOpen]);

  const handleImageUpload = async (files: FileList) => {
    setUploadingImages(true);
    setError(null);

    try {
      // Validate file count
      const remainingSlots = 5 - images.length;
      if (remainingSlots <= 0) {
        setError("Maximum 5 images allowed");
        setUploadingImages(false);
        return;
      }

      const filesArray = Array.from(files).slice(0, remainingSlots);

      // Validate each file
      for (const file of filesArray) {
        // Check file type
        if (!file.type.startsWith("image/")) {
          setError("Please upload only image files (JPG, PNG, etc.)");
          setUploadingImages(false);
          return;
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setError("Image size must be less than 5MB");
          setUploadingImages(false);
          return;
        }

        // Check minimum file size (at least 1KB)
        if (file.size < 1024) {
          setError("Image file is too small");
          setUploadingImages(false);
          return;
        }
      }

      const uploadPromises = filesArray.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("kind", "post");

        const res = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to upload image");
        }

        const data = await res.json();
        return data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error("Failed to upload images:", error);
      setError(error instanceof Error ? error.message : "Failed to upload images. Please try again.");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError(null);

    // Content validation
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setError("Please enter some content");
      return;
    }

    if (trimmedContent.length < 10) {
      setError("Content must be at least 10 characters long");
      return;
    }

    if (trimmedContent.length > 2000) {
      setError("Content must be less than 2000 characters");
      return;
    }

    // Post type specific validation
    if (postType === CommunityPostType.SOS) {
      if (!sosCategory) {
        setError("Please select an SOS category");
        return;
      }
    }

    if (postType === CommunityPostType.MEETUP) {
      if (!meetupLocation || !meetupLocation.trim()) {
        setError("Please provide a location for the meetup");
        return;
      }

      if (meetupLocation.trim().length < 3) {
        setError("Location must be at least 3 characters long");
        return;
      }

      if (!meetupDate) {
        setError("Please select a date for the meetup");
        return;
      }

      // Validate date is not in the past
      const selectedDate = new Date(meetupDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        setError("Meetup date cannot be in the past");
        return;
      }

      // If time is provided, validate it
      if (meetupTime) {
        const [hours, minutes] = meetupTime.split(":").map(Number);
        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
          setError("Please enter a valid time");
          return;
        }
      }
    }

    if (postType === CommunityPostType.GYAAN) {
      if (!gyaanTitle || !gyaanTitle.trim()) {
        setError("Please provide a title for the tip");
        return;
      }

      if (gyaanTitle.trim().length < 5) {
        setError("Tip title must be at least 5 characters long");
        return;
      }

      if (gyaanTitle.trim().length > 100) {
        setError("Tip title must be less than 100 characters");
        return;
      }

      if (!gyaanCategory) {
        setError("Please select a category for the tip");
        return;
      }
    }

    // Check if posting globally or to community
    if (isGlobal && !circleId) {
      setError("Cannot post globally without a circle");
      return;
    }

    if (!isGlobal && !circleId) {
      setError("Please select a community or enable global posting");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        type: postType,
        content: content.trim(),
        mediaUrls: images,
      };

      if (postType === CommunityPostType.SOS) {
        payload.sosCategory = sosCategory;
        payload.sosUrgency = sosUrgency;
      }

      if (postType === CommunityPostType.MEETUP) {
        payload.meetupLocation = meetupLocation;
        const dateTime = meetupTime
          ? `${meetupDate}T${meetupTime}`
          : `${meetupDate}T12:00`;
        payload.meetupDate = new Date(dateTime).toISOString();
      }

      if (postType === CommunityPostType.GYAAN) {
        payload.gyaanTitle = gyaanTitle;
        payload.gyaanCategory = gyaanCategory;
      }

      // Use global endpoint if isGlobal is true, otherwise use circle endpoint
      const endpoint = isGlobal
        ? "/api/community/posts/global"
        : `/api/community/circles/${circleId}/post`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to create post");
        setIsSubmitting(false);
        return;
      }

      // Success - reset form and close
      setContent("");
      setSosCategory("");
      setSosUrgency(3);
      setMeetupLocation("");
      setMeetupDate("");
      setMeetupTime("");
      setGyaanTitle("");
      setGyaanCategory("");
      setImages([]);
      setPostType(CommunityPostType.GENERAL);
      setIsGlobal(false);
      setIsSubmitting(false);
      onPostCreated?.();
      onClose();
    } catch (error) {
      console.error("Failed to create post:", error);
      setError("Failed to create post. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <div className="text-lg font-bold text-gray-800">
              Create Post
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {isGlobal ? "Share globally" : circleName ? `Share with ${circleName}` : "Create post"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all border-none bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Global/Community Toggle */}
          {allowGlobal && circleId && (
            <div className="mb-4">
              <div className="flex gap-2 p-1 rounded-lg border border-gray-200 bg-gray-50">
                <button
                  onClick={() => setIsGlobal(false)}
                  className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold transition-all border-none flex items-center justify-center gap-1.5 ${
                    !isGlobal
                      ? "bg-white text-gray-800 shadow-sm"
                      : "bg-transparent text-gray-500"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <Users className="w-3.5 h-3.5" />
                  {circleName || "Community"}
                </button>
                <button
                  onClick={() => setIsGlobal(true)}
                  className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold transition-all border-none flex items-center justify-center gap-1.5 ${
                    isGlobal
                      ? "bg-white text-gray-800 shadow-sm"
                      : "bg-transparent text-gray-500"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  Global
                </button>
              </div>
            </div>
          )}


          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-xs font-semibold border border-red-200">
              {error}
            </div>
          )}

          {/* Form in Table Style */}
          <div className="w-full border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {/* Post Type Section */}
            <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-200">
              Post Type
            </div>
            <div className="px-4 py-3">
              <div className="flex gap-2 flex-wrap">
                {[
                  { type: CommunityPostType.GENERAL, icon: MessageSquare, label: "Post" },
                  { type: CommunityPostType.MEETUP, icon: MapPin, label: "Meetup" },
                  { type: CommunityPostType.GYAAN, icon: Lightbulb, label: "Tip" },
                  { type: CommunityPostType.SOS, icon: AlertTriangle, label: "SOS", sos: true },
                ].map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <button
                      key={option.type}
                      onClick={() => setPostType(option.type)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                        postType === option.type
                          ? option.sos
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-orange-500 text-white border-orange-500"
                          : option.sos
                          ? "bg-gray-50 text-red-600 border-gray-300"
                          : "bg-gray-50 text-gray-600 border-gray-300"
                      } hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gyaan Title Input */}
            {postType === CommunityPostType.GYAAN && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 border-b border-gray-100">
                  <div className="px-4 py-3 text-sm font-medium text-gray-600 bg-gray-50 md:col-span-1 flex items-center">
                    Tip Title <span className="text-red-500 ml-0.5">*</span>
                  </div>
                  <div className="px-4 py-3 md:col-span-2">
                    <input
                      type="text"
                      value={gyaanTitle}
                      onChange={(e) => setGyaanTitle(e.target.value)}
                      placeholder="e.g., How to get your security deposit back"
                      className={`w-full border rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                        gyaanTitle && (gyaanTitle.length < 5 || gyaanTitle.length > 100)
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {gyaanTitle && (gyaanTitle.length < 5 || gyaanTitle.length > 100) && (
                      <p className="mt-1 text-xs text-red-500">
                        {gyaanTitle.length < 5 ? "Title must be at least 5 characters" : "Title must be less than 100 characters"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Gyaan Category */}
                <div className="grid grid-cols-1 md:grid-cols-3 border-b border-gray-100 last:border-0">
                  <div className="px-4 py-3 text-sm font-medium text-gray-600 bg-gray-50 md:col-span-1 flex items-center">
                    Category <span className="text-red-500 ml-0.5">*</span>
                  </div>
                  <div className="px-4 py-3 md:col-span-2">
                    <select
                      value={gyaanCategory}
                      onChange={(e) => setGyaanCategory(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    >
                      <option value="">Select category</option>
                      <option value="housing">Housing</option>
                      <option value="legal">Legal</option>
                      <option value="health">Health</option>
                      <option value="work">Work</option>
                      <option value="government">Government</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* SOS Category */}
            {postType === CommunityPostType.SOS && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 border-b border-gray-100">
                  <div className="px-4 py-3 text-sm font-medium text-gray-600 bg-gray-50 md:col-span-1 flex items-center">
                    What kind of help do you need? <span className="text-red-500 ml-0.5">*</span>
                  </div>
                  <div className="px-4 py-3 md:col-span-2">
                    <select
                      value={sosCategory}
                      onChange={(e) => setSosCategory(e.target.value as SOSCategory)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    >
                      <option value="">Select category</option>
                      <option value={SOSCategory.HOUSING}>Housing</option>
                      <option value={SOSCategory.PAYMENT}>Payment</option>
                      <option value={SOSCategory.MEDICAL}>Medical</option>
                      <option value={SOSCategory.SAFETY}>Safety</option>
                      <option value={SOSCategory.LOAN}>Loan</option>
                      <option value={SOSCategory.LEGAL}>Legal</option>
                      <option value={SOSCategory.OTHER}>Other</option>
                    </select>
                  </div>
                </div>

                {/* SOS Urgency */}
                <div className="grid grid-cols-1 md:grid-cols-3 border-b border-gray-100 last:border-0">
                  <div className="px-4 py-3 text-sm font-medium text-gray-600 bg-gray-50 md:col-span-1 flex items-center">
                    Urgency Level <span className="text-red-500 ml-0.5">*</span>
                  </div>
                  <div className="px-4 py-3 md:col-span-2">
                    <div className="flex gap-2">
                      {[
                        { level: 1, label: "Critical", color: "bg-red-600", textColor: "text-white", borderColor: "border-red-600" },
                        { level: 2, label: "Urgent", color: "bg-yellow-500", textColor: "text-white", borderColor: "border-yellow-500" },
                        { level: 3, label: "Moderate", color: "bg-blue-500", textColor: "text-white", borderColor: "border-blue-500" },
                      ].map((option) => (
                        <button
                          key={option.level}
                          onClick={() => setSosUrgency(option.level as 1 | 2 | 3)}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                            sosUrgency === option.level
                              ? `${option.color} ${option.textColor} ${option.borderColor}`
                              : "bg-gray-50 text-gray-600 border-gray-300"
                          } hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Meetup Location */}
            {postType === CommunityPostType.MEETUP && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 border-b border-gray-100">
                  <div className="px-4 py-3 text-sm font-medium text-gray-600 bg-gray-50 md:col-span-1 flex items-center">
                    Location <span className="text-red-500 ml-0.5">*</span>
                  </div>
                  <div className="px-4 py-3 md:col-span-2">
                    <input
                      type="text"
                      value={meetupLocation}
                      onChange={(e) => setMeetupLocation(e.target.value)}
                      placeholder="e.g., Khadakwasla Lake, Pune"
                      className={`w-full border rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                        meetupLocation && meetupLocation.trim().length < 3
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {meetupLocation && meetupLocation.trim().length < 3 && (
                      <p className="mt-1 text-xs text-red-500">
                        Location must be at least 3 characters
                      </p>
                    )}
                  </div>
                </div>

                {/* Meetup Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-3 border-b border-gray-100 last:border-0">
                  <div className="px-4 py-3 text-sm font-medium text-gray-600 bg-gray-50 md:col-span-1 flex items-center">
                    Date & Time <span className="text-red-500 ml-0.5">*</span>
                  </div>
                  <div className="px-4 py-3 md:col-span-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input
                          type="date"
                          value={meetupDate}
                          onChange={(e) => setMeetupDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className={`w-full border rounded-md px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                            meetupDate && new Date(meetupDate) < new Date(new Date().setHours(0, 0, 0, 0))
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        />
                        {meetupDate && new Date(meetupDate) < new Date(new Date().setHours(0, 0, 0, 0)) && (
                          <p className="mt-1 text-xs text-red-500">
                            Date cannot be in the past
                          </p>
                        )}
                      </div>
                      <div>
                        <input
                          type="time"
                          value={meetupTime}
                          onChange={(e) => setMeetupTime(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Content Textarea */}
            <div className="grid grid-cols-1 md:grid-cols-3 border-b border-gray-100 last:border-0">
              <div className="px-4 py-3 text-sm font-medium text-gray-600 bg-gray-50 md:col-span-1 flex items-center">
                {postType === CommunityPostType.GYAAN
                  ? "Tip Details"
                  : postType === CommunityPostType.SOS
                  ? "Describe your situation"
                  : "Content"} <span className="text-red-500 ml-0.5">*</span>
              </div>
              <div className="px-4 py-3 md:col-span-2">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    postType === CommunityPostType.GENERAL
                      ? `Share something with ${circleName}...`
                      : postType === CommunityPostType.JOB_SHARE
                      ? "Describe the job opportunity..."
                      : postType === CommunityPostType.MEETUP
                      ? "Tell us about the meetup..."
                      : postType === CommunityPostType.GYAAN
                      ? "Share your knowledge and tips..."
                      : "Describe what help you need..."
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
                  rows={5}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handleSubmit();
                    }
                  }}
                />
                <div className={`mt-1 text-xs text-right ${
                  content.length > 2000 ? "text-red-500" : content.length < 10 ? "text-yellow-600" : "text-gray-400"
                } ${content.length > 2000 || content.length < 10 ? "font-semibold" : ""}`}>
                  {content.length} / 2000 characters
                  {content.length < 10 && content.length > 0 && " (minimum 10)"}
                  {content.length > 2000 && " (exceeds limit)"}
                </div>
              </div>
            </div>

          </div>

          {/* Image Upload Section */}
          <div className="mt-4 px-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <label
                  className="text-sm font-bold"
                  style={{
                    color: "var(--ink)",
                  }}
                >
                  Images
                </label>
                <span
                  className="text-xs font-medium"
                  style={{
                    color: "var(--muted)",
                  }}
                >
                  ({images.length}/5)
                </span>
              </div>
              {images.length < 5 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImages}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border-2"
                  style={{
                    background: uploadingImages ? "var(--cream)" : "white",
                    color: "var(--saffron)",
                    borderColor: "var(--saffron)",
                    cursor: uploadingImages ? "not-allowed" : "pointer",
                    opacity: uploadingImages ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!uploadingImages) {
                      e.currentTarget.style.background = "var(--saffron-light)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!uploadingImages) {
                      e.currentTarget.style.background = "white";
                    }
                  }}
                >
                  {uploadingImages ? (
                    <>
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4" />
                      Add Images
                    </>
                  )}
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files) {
                  handleImageUpload(e.target.files);
                }
              }}
            />
            {images.length > 0 ? (
              <div className="grid grid-cols-3 gap-2.5 mt-3">
                {images.map((url, index) => (
                  <div
                    key={index}
                    className="relative group rounded-xl overflow-hidden"
                    style={{
                      aspectRatio: "1",
                      border: "1px solid var(--border)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <img
                      src={url}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center border-none bg-black bg-opacity-70 text-white hover:bg-opacity-90 transition-all opacity-0 group-hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        transition: "opacity 0.2s",
                      }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="mt-2 p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--paper)",
                  minHeight: "100px",
                }}
                onClick={() => fileInputRef.current?.click()}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--saffron)";
                  e.currentTarget.style.background = "var(--saffron-light)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.background = "var(--paper)";
                }}
              >
                <ImageIcon className="w-8 h-8 mb-2" style={{ color: "var(--muted)" }} />
                <div className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                  Click to add images
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                  JPG, PNG up to 5MB each
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-4 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isSubmitting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
