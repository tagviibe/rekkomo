"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

const EVENT_TYPES = [
  { icon: "🪔", label: "Cultural", desc: "Chhath, Navratri, festivals" },
  { icon: "💼", label: "Job Fair", desc: "Hiring drives, career events" },
  { icon: "🎓", label: "Training", desc: "Skill development workshops" },
  { icon: "👥", label: "Meetup", desc: "Community gatherings" },
];

export default function EventForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [primaryCircle, setPrimaryCircle] = useState<any>(null);
  const [primaryCommunity, setPrimaryCommunity] = useState<any>(null);

  // Step 1: Event Details
  const [eventType, setEventType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isInPerson, setIsInPerson] = useState(true);
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [contact, setContact] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Step 2: Tickets & RSVP
  const [entryType, setEntryType] = useState("free");
  const [ticketPrice, setTicketPrice] = useState("");
  const [rsvpRequired, setRsvpRequired] = useState(true);

  // Step 3: Audience & Boost
  const [postTo, setPostTo] = useState("global");
  const [boostEnabled, setBoostEnabled] = useState(false);

  useEffect(() => {
    // Fetch primary circle and community
    Promise.all([
      fetch("/api/community/circles").then((res) => res.json()),
      fetch("/api/communities/my-circle").then((res) => res.json()),
    ])
      .then(([circlesData, communityData]) => {
        const all = [
          ...(circlesData.circles.STATE || []),
          ...(circlesData.circles.DISTRICT || []),
          ...(circlesData.circles.MOHALLA || []),
        ];
        const primary = all.find((c: any) => c.isMember && c.level === "STATE");
        if (primary) {
          setPrimaryCircle(primary);
        }
        if (communityData.circle) {
          console.log("Primary community found:", communityData.circle);
          setPrimaryCommunity(communityData.circle);
          setPostTo("community");
        } else {
          console.log("No primary community found. Defaulting to global feed.");
          setPostTo("global");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch circles/community:", err);
        setError("Failed to load your communities. Please refresh the page.");
      });

    // Set organizer name
    if (session?.user?.name) {
      setOrganizer(session.user.name);
    }

    // Auto-populate location (only once on mount)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const res = await fetch(
              `/api/geo/reverse?lat=${latitude}&lon=${longitude}`
            );
            if (res.ok) {
              const data = await res.json();
              if (data.label) {
                setLocation((prev) => prev || data.label);
                return;
              }
            }
          } catch (err) {
            console.error("Failed to reverse geocode:", err);
          }
        },
        () => {
          // User denied or error - silently fail
        },
        { enableHighAccuracy: false, timeout: 8000 }
      );
    }
  }, [session]);

  const progress = ((currentStep - 1) / 3) * 100;

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    const targetCommunity = postTo === "community" ? primaryCommunity : null;

    // Validate required fields
    if (!title || !date || !startTime) {
      setError("Please fill in all required fields (Title, Date, and Start Time)");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("kind", "post");
        const uploadRes = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          const data = await uploadRes.json().catch(() => ({}));
          throw new Error(data.error ?? "Image upload failed");
        }
        const data = await uploadRes.json();
        imageUrl = data.url;
      }

      const startsAt = new Date(`${date}T${startTime}`);
      
      // Validate date
      if (isNaN(startsAt.getTime())) {
        throw new Error("Invalid date or time. Please check your inputs.");
      }

      console.log("Creating event with:", {
        communityId: targetCommunity?.id || undefined,
        postTo,
        title,
        description,
        startsAt: startsAt.toISOString(),
        location: isInPerson ? location : undefined,
        onlineLink: !isInPerson ? location : undefined,
        capacity: capacity ? parseInt(capacity) : undefined,
        imageUrl,
      });

      // Create event via events API
      // If postTo is "global" or no community, don't send communityId (API will create global community)
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(targetCommunity ? { communityId: targetCommunity.id } : {}),
          title,
          description,
          startsAt: startsAt.toISOString(),
          location: isInPerson ? location : undefined,
          onlineLink: !isInPerson ? location : undefined,
          capacity: capacity ? parseInt(capacity) : undefined,
          imageUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to create event" }));
        console.error("Event creation failed:", errorData);
        throw new Error(errorData.error || errorData.details || `Failed to create event (${response.status})`);
      }

      const result = await response.json();
      console.log("Event created successfully:", result);
      router.push(`/events?created=true`);
    } catch (err: any) {
      console.error("Error creating event:", err);
      setError(err.message || "Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const eventDate = date ? new Date(date) : null;
  const previewDate = eventDate
    ? eventDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : "";

  return (
    <div className="form-page-wrap">
      {/* Progress Bar */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Progress Steps */}
      <div className="progress-steps">
        <div className={`progress-step ${currentStep > 1 ? "done" : currentStep === 1 ? "active" : ""}`}>
          <div className="progress-step-inner">
            <div className="progress-step-num">1</div>
            <div className="progress-step-label">Event Details</div>
          </div>
        </div>
        <div className={`progress-step ${currentStep > 2 ? "done" : currentStep === 2 ? "active" : ""}`}>
          <div className="progress-step-inner">
            <div className="progress-step-num">2</div>
            <div className="progress-step-label">Tickets & RSVP</div>
          </div>
        </div>
        <div className={`progress-step ${currentStep === 3 ? "active" : ""}`}>
          <div className="progress-step-inner">
            <div className="progress-step-num">3</div>
            <div className="progress-step-label">Audience & Boost</div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message" style={{ gridColumn: "1/-1", marginBottom: "20px" }}>
          <span style={{ fontSize: "18px" }}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Main Form */}
      <div style={{ gridColumn: "1" }}>
        {/* Step 1: Event Details */}
        {currentStep === 1 && (
          <div className="form-card slide-up">
            <div className="form-card-header">
              <div>
                <div className="fch-title">Event Details</div>
                <div className="fch-sub">Tell people about your event</div>
              </div>
              <div className="fch-badge event">🎉 Create Event</div>
            </div>
            <div className="form-body">
              <div className="form-section">
                <div className="section-title">Event Type</div>
                <div className="card-radio-group card-radio-4">
                  {EVENT_TYPES.map((type) => (
                    <div
                      key={type.label}
                      className={`card-radio ${eventType === type.label ? "selected" : ""}`}
                      onClick={() => setEventType(type.label)}
                    >
                      <div className="cr-check">✓</div>
                      <span className="cr-icon">{type.icon}</span>
                      <div className="cr-label">{type.label}</div>
                      <div className="cr-desc">{type.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <div className="section-title">Basic Information</div>
                <div className="field-row cols-1">
                  <div className="field">
                    <div className="field-label">
                      Event Name <span className="required">*</span>
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Chhath Puja 2025 — Bihar Community Pune"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                </div>
                <div className="field-row cols-1">
                  <div className="field">
                    <div className="field-label">
                      Event Description <span className="required">*</span>
                    </div>
                    <textarea
                      className="form-textarea"
                      placeholder="Tell people what the event is about, who it's for, and what they can expect. Write in simple, warm language."
                      rows={4}
                      maxLength={600}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                    <div className="char-count">{description.length}/600 chars</div>
                  </div>
                </div>
                <div className="field-row cols-1">
                  <div className="field">
                    <div className="field-label">
                      Cover Image <span className="optional">(recommended)</span>
                    </div>
                    {imagePreview ? (
                      <div style={{ position: "relative", marginBottom: "12px" }}>
                        <img
                          src={imagePreview}
                          alt="Preview"
                          style={{
                            width: "100%",
                            maxHeight: "200px",
                            objectFit: "cover",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--fog)",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: "rgba(0,0,0,0.6)",
                            color: "white",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "16px",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(239,68,68,0.8)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(0,0,0,0.6)";
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div
                        className="media-upload"
                        onClick={() => document.getElementById("event-image-input")?.click()}
                      >
                        <div className="mu-icon">🖼️</div>
                        <div className="mu-title">Upload a cover image</div>
                        <div className="mu-sub">JPG or PNG, min. 1200×630px for best quality, max 5MB</div>
                        <div className="mu-btn">Choose File</div>
                        <input
                          type="file"
                          id="event-image-input"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                setError("Image size must be less than 5MB");
                                return;
                              }
                              if (!file.type.startsWith("image/")) {
                                setError("Please select an image file");
                                return;
                              }
                              setImageFile(file);
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setImagePreview(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-title">Date, Time & Location</div>
                <div className="datetime-row">
                  <div className="field">
                    <div className="field-label">
                      Date <span className="required">*</span>
                    </div>
                    <div className="input-wrap">
                      <span className="input-prefix">📅</span>
                      <input
                        type="date"
                        className="form-input"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <div className="field-label">
                      Start Time <span className="required">*</span>
                    </div>
                    <div className="input-wrap">
                      <span className="input-prefix">⏰</span>
                      <input
                        type="time"
                        className="form-input"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <div className="field-label">
                      End Time <span className="optional">(optional)</span>
                    </div>
                    <div className="input-wrap">
                      <span className="input-prefix">⏰</span>
                      <input
                        type="time"
                        className="form-input"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="field-row cols-1">
                  <div
                    className={`toggle-row ${isInPerson ? "on" : ""}`}
                    onClick={() => setIsInPerson(!isInPerson)}
                  >
                    <div className="tr-info">
                      <div className="tr-title">This is an in-person event</div>
                      <div className="tr-desc">Turn off if this is an online / virtual event</div>
                    </div>
                    <div className={`toggle-switch ${isInPerson ? "on" : ""}`} />
                  </div>
                </div>

                {isInPerson && (
                  <>
                    <div className="field-row cols-1">
                      <div className="field">
                        <div className="field-label">
                          Venue / Location <span className="required">*</span>
                        </div>
                        <div className="location-row">
                          <div className="input-wrap" style={{ flex: 1 }}>
                            <span className="input-prefix">📍</span>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. Khadakwasla Lake, Pune"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                            />
                          </div>
                          <button
                            type="button"
                            className="location-detect"
                            disabled={detectingLocation}
                            onClick={async () => {
                              if (!navigator.geolocation) {
                                alert("Geolocation is not supported by your browser");
                                return;
                              }
                              setDetectingLocation(true);
                              try {
                                navigator.geolocation.getCurrentPosition(
                                  async (pos) => {
                                    const { latitude, longitude } = pos.coords;
                                    try {
                                      const res = await fetch(
                                        `/api/geo/reverse?lat=${latitude}&lon=${longitude}`
                                      );
                                      if (res.ok) {
                                        const data = await res.json();
                                        if (data.label) {
                                          setLocation(data.label);
                                        } else {
                                          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                                        }
                                      } else {
                                        setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                                      }
                                    } catch (err) {
                                      setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                                    } finally {
                                      setDetectingLocation(false);
                                    }
                                  },
                                  (err) => {
                                    alert("Could not detect location. Please enter manually.");
                                    setDetectingLocation(false);
                                  },
                                  { enableHighAccuracy: false, timeout: 10000 }
                                );
                              } catch (err) {
                                setDetectingLocation(false);
                                alert("Could not detect location");
                              }
                            }}
                          >
                            {detectingLocation ? "⏳ Detecting..." : "📡 Detect"}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="field-row cols-1">
                      <div className="field">
                        <div className="field-label">
                          Capacity <span className="optional">(optional)</span>
                        </div>
                        <div className="input-wrap">
                          <span className="input-prefix">👥</span>
                          <input
                            type="number"
                            className="form-input"
                            placeholder="500 (leave blank for unlimited)"
                            value={capacity}
                            onChange={(e) => setCapacity(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="form-section">
                <div className="section-title">Organiser Details</div>
                <div className="field-row cols-2">
                  <div className="field">
                    <div className="field-label">
                      Organised by <span className="required">*</span>
                    </div>
                    <div className="input-wrap">
                      <span className="input-prefix">👤</span>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Your name or organisation"
                        value={organizer}
                        onChange={(e) => setOrganizer(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <div className="field-label">
                      Contact (WhatsApp) <span className="optional">(optional)</span>
                    </div>
                    <div className="input-wrap">
                      <span className="input-prefix">📱</span>
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="+91 98765 43210"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Tickets & RSVP */}
        {currentStep === 2 && (
          <div className="form-card slide-up">
            <div className="form-card-header">
              <div>
                <div className="fch-title">Tickets & RSVP</div>
                <div className="fch-sub">Is this a free or paid event?</div>
              </div>
              <div className="fch-badge event">🎉 Step 2 of 3</div>
            </div>
            <div className="form-body">
              <div className="form-section">
                <div className="section-title">Entry Type</div>
                <div className="card-radio-group">
                  <div
                    className={`card-radio ${entryType === "free" ? "selected" : ""}`}
                    onClick={() => setEntryType("free")}
                  >
                    <div className="cr-check">✓</div>
                    <span className="cr-icon">🆓</span>
                    <div className="cr-label">Free Entry</div>
                    <div className="cr-desc">No payment, RSVP only</div>
                  </div>
                  <div
                    className={`card-radio ${entryType === "paid" ? "selected" : ""}`}
                    onClick={() => setEntryType("paid")}
                  >
                    <div className="cr-check">✓</div>
                    <span className="cr-icon">🎟️</span>
                    <div className="cr-label">Paid Tickets</div>
                    <div className="cr-desc">Sell tickets, 8% platform fee</div>
                  </div>
                </div>
              </div>

              {entryType === "paid" && (
                <div className="form-section">
                  <div className="section-title">Ticket Pricing</div>
                  <div className="field-row cols-1">
                    <div className="field">
                      <div className="field-label">
                        Ticket Price <span className="required">*</span>
                      </div>
                      <div className="input-wrap suffix">
                        <span className="input-prefix">₹</span>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="99"
                          value={ticketPrice}
                          onChange={(e) => setTicketPrice(e.target.value)}
                        />
                        <span className="input-suffix">per person</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-section">
                <div className="section-title">RSVP Settings</div>
                <div className="field-row cols-1">
                  <div
                    className={`toggle-row ${rsvpRequired ? "on" : ""}`}
                    onClick={() => setRsvpRequired(!rsvpRequired)}
                  >
                    <div className="tr-info">
                      <div className="tr-title">Require RSVP</div>
                      <div className="tr-desc">
                        People must confirm attendance before the event
                      </div>
                    </div>
                    <div className={`toggle-switch ${rsvpRequired ? "on" : ""}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Audience & Boost */}
        {currentStep === 3 && (
          <div className="form-card slide-up">
            <div className="form-card-header">
              <div>
                <div className="fch-title">Audience & Boost</div>
                <div className="fch-sub">Who should see this event?</div>
              </div>
              <div className="fch-badge event">🎉 Step 3 of 3</div>
            </div>
            <div className="form-body">
              <div className="form-section">
                <div className="section-title">Audience</div>
                <div className="field-row cols-1">
                  <div className="field">
                    <div className="field-label">
                      Post to <span className="required">*</span>
                    </div>
                    <div className="card-radio-group">
                      <div
                        className={`card-radio ${postTo === "community" && primaryCommunity ? "selected" : ""}`}
                        onClick={() => {
                          if (primaryCommunity) {
                            setPostTo("community");
                            setError(null);
                          } else {
                            setPostTo("global");
                            setError("You need to join a community circle first to post to community feed. Posting to Global Feed instead.");
                            setTimeout(() => setError(null), 5000);
                          }
                        }}
                        style={{
                          opacity: primaryCommunity ? 1 : 0.6,
                          cursor: "pointer",
                        }}
                      >
                        <div className="cr-check">✓</div>
                        <span className="cr-icon">👥</span>
                        <div className="cr-label">My Community Circle</div>
                        <div className="cr-desc">
                          {primaryCommunity
                            ? `${primaryCommunity.name} · ${primaryCommunity.memberCount || 0} members`
                            : "Join a circle to post here"}
                        </div>
                      </div>
                      <div
                        className={`card-radio ${postTo === "global" ? "selected" : ""}`}
                        onClick={() => setPostTo("global")}
                      >
                        <div className="cr-check">✓</div>
                        <span className="cr-icon">🌐</span>
                        <div className="cr-label">Global Feed</div>
                        <div className="cr-desc">Visible to all users in your city</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {postTo === "community" && (
                <div className="form-section">
                  <div className="section-title">Boost Event</div>
                  <div className="boost-section">
                    <div className="boost-section-header">
                      <div className="bsh-icon">⭐</div>
                      <div>
                        <div className="bsh-title">Feature in Community Feed</div>
                        <div className="bsh-sub">
                          Your event appears at the top of the feed for 7 days
                        </div>
                      </div>
                      <div className="bsh-toggle">
                        <div
                          className={`toggle-switch ${boostEnabled ? "on" : ""}`}
                          onClick={() => setBoostEnabled(!boostEnabled)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px 16px",
              background: "var(--coral-light)",
              border: "1px solid var(--coral)",
              borderRadius: "var(--radius-md)",
              color: "var(--coral)",
              fontSize: "13px",
              fontWeight: 600,
              gridColumn: "1/-1",
            }}
          >
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Right Column Preview */}
      <div className="right-col">
        <div className="preview-card">
          <div className="pc-header">
            <div className="pch-eyebrow">Preview</div>
            <div className="pch-title">How your event will look</div>
          </div>
          <div className="pc-body">
            <div className="preview-event">
              <div className="pe-banner" style={{ position: "relative" }}>
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Event preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      position: "absolute",
                      inset: 0,
                    }}
                  />
                ) : (
                  <div style={{ fontSize: "36px" }}>
                    {eventType && EVENT_TYPES.find((t) => t.label === eventType)?.icon || "🎉"}
                  </div>
                )}
                {previewDate && (
                  <div className="pe-date-pill" style={{ position: "relative", zIndex: 2 }}>
                    <div className="pedp-day">
                      {eventDate?.getDate() || ""}
                    </div>
                    <div className="pedp-mon">
                      {eventDate?.toLocaleDateString("en-IN", { month: "short" }) || ""}
                    </div>
                  </div>
                )}
                {imagePreview && eventType && (
                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.95)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      boxShadow: "var(--shadow-md)",
                      zIndex: 2,
                      border: "2px solid rgba(255,255,255,0.5)",
                    }}
                  >
                    {EVENT_TYPES.find((t) => t.label === eventType)?.icon || "🎉"}
                  </div>
                )}
              </div>
              <div className="pe-body">
                {eventType && (
                  <div className="pe-type-badge" style={{ background: "var(--green-light)", color: "var(--green)" }}>
                    {eventType.toUpperCase()}
                  </div>
                )}
                <div className="pe-title">{title || "Event Name"}</div>
                <div className="pe-meta">
                  {location && <span>📍 {location}</span>}
                  {entryType === "free" && <span>🆓 Free Entry</span>}
                  {entryType === "paid" && ticketPrice && (
                    <span>🎟️ ₹{ticketPrice} Entry</span>
                  )}
                </div>
                {rsvpRequired && (
                  <div className="pe-rsvp-bar">
                    <div className="pe-rsvp-label">
                      <span>0 / {capacity || "∞"} going</span>
                      <span style={{ color: "var(--green)", fontWeight: 600 }}>0%</span>
                    </div>
                    <div className="pe-rsvp-track">
                      <div className="pe-rsvp-fill" style={{ width: "0%" }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Footer */}
      <div className="form-footer">
        <div className="ff-save">
          <div className="ff-save-dot" />
          <span>Auto-saving...</span>
        </div>
        <div className="ff-actions">
          {currentStep > 1 && (
            <button type="button" className="btn-prev" onClick={handlePrev}>
              ← Previous
            </button>
          )}
          {currentStep < 3 ? (
            <button
              type="button"
              className="btn-next"
              onClick={handleNext}
              disabled={!title || !description || !date || !startTime || (isInPerson && !location)}
            >
              Next Step →
            </button>
          ) : (
            <button
              type="button"
              className="btn-publish"
              onClick={handleSubmit}
              disabled={loading || !title || !date || !startTime}
            >
              {loading ? "Publishing..." : "✓ Publish Event"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
