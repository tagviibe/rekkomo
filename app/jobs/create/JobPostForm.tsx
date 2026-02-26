"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

const JOB_CATEGORIES = [
  "🏗️ Construction",
  "🏭 Manufacturing",
  "🏠 Household / Domestic",
  "🚗 Driving / Logistics",
  "🍳 Food / Catering",
  "🔧 Plumbing / Electrical",
  "🏥 Healthcare",
  "🎓 Teaching / Tutoring",
  "📦 Warehouse",
  "🔐 Security",
  "💻 IT / Tech",
  "🧹 Cleaning / Housekeeping",
  "Other",
];

const JOB_TYPES = [
  "Full-time",
  "Part-time",
  "Contract / Fixed Term",
  "Daily Wage",
  "Freelance / Gig",
];

const PAY_TYPES = [
  { value: "Monthly", icon: "📅", suffix: "/mo" },
  { value: "Daily", icon: "☀️", suffix: "/day" },
  { value: "Weekly", icon: "📆", suffix: "/week" },
  { value: "Fixed/Project", icon: "🎯", suffix: "" },
];

const LANGUAGES = [
  "Hindi",
  "Marathi",
  "Bhojpuri",
  "Bengali",
  "Odia",
  "Telugu",
  "Tamil",
  "English",
  "Any",
];

const BENEFITS = [
  { icon: "🏠", label: "Housing" },
  { icon: "🍱", label: "Free Meals" },
  { icon: "🚌", label: "Transport" },
  { icon: "🏥", label: "Medical" },
  { icon: "⏰", label: "Overtime Pay" },
  { icon: "📅", label: "Weekly Off" },
  { icon: "💳", label: "PF/ESI" },
  { icon: "🎓", label: "Skill Training" },
];

export default function JobPostForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Job Details
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [jobType, setJobType] = useState("");
  const [description, setDescription] = useState("");
  const [payType, setPayType] = useState("Monthly");
  const [payMin, setPayMin] = useState("");
  const [payMax, setPayMax] = useState("");
  const [duration, setDuration] = useState("");
  const [vacancies, setVacancies] = useState("1");
  const [location, setLocation] = useState("");
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Step 2: Requirements
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [genderPref, setGenderPref] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [applyMethod, setApplyMethod] = useState("");
  const [deadline, setDeadline] = useState("");

  // Step 3: Reach & Boost
  const [postTo, setPostTo] = useState("global");
  const [boostEnabled, setBoostEnabled] = useState(false);
  const [boostTier, setBoostTier] = useState("");
  const [targetStates, setTargetStates] = useState<string[]>([]);

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

  const toggleBenefit = (benefit: string) => {
    setSelectedBenefits((prev) =>
      prev.includes(benefit)
        ? prev.filter((b) => b !== benefit)
        : [...prev, benefit]
    );
  };

  const toggleLanguage = (lang: string) => {
    setLanguages((prev) =>
      prev.includes(lang)
        ? prev.filter((l) => l !== lang)
        : [...prev, lang]
    );
  };

  const addSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      setSkills((prev) => [...prev, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  useEffect(() => {
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
  }, []);

  const handleSubmit = async () => {
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

      const payTypeSuffix = PAY_TYPES.find((pt) => pt.value === payType)?.suffix || "";
      
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          skillCategory: category.replace(/^[^\s]+\s/, ""), // Remove emoji
          payMin: payMin ? parseInt(payMin) : undefined,
          payMax: payMax ? parseInt(payMax) : undefined,
          location,
          languagePref: languages,
          statePref: targetStates[0] || undefined,
          numberOfOpenings: parseInt(vacancies) || 1,
          deadline: deadline || undefined,
          description,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create job");
      }

      const { job } = await response.json();
      router.push(`/jobs?created=${job.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

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
            <div className="progress-step-label">Job Details</div>
          </div>
        </div>
        <div className={`progress-step ${currentStep > 2 ? "done" : currentStep === 2 ? "active" : ""}`}>
          <div className="progress-step-inner">
            <div className="progress-step-num">2</div>
            <div className="progress-step-label">Requirements</div>
          </div>
        </div>
        <div className={`progress-step ${currentStep === 3 ? "active" : ""}`}>
          <div className="progress-step-inner">
            <div className="progress-step-num">3</div>
            <div className="progress-step-label">Reach & Boost</div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div style={{ gridColumn: "1" }}>
        {/* Step 1: Job Details */}
        {currentStep === 1 && (
          <div className="form-card slide-up">
            <div className="form-card-header">
              <div>
                <div className="fch-title">Job Details</div>
                <div className="fch-sub">Tell workers about the role and pay</div>
              </div>
              <div className="fch-badge job">💼 Job Posting</div>
            </div>
            <div className="form-body">
              <div className="form-section">
                <div className="section-title">Basic Information</div>
                <div className="field-row cols-1">
                  <div className="field">
                    <div className="field-label">
                      Job Title <span className="required">*</span>
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Senior Mason, Machine Operator, Cook"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                </div>
                <div className="field-row cols-2">
                  <div className="field">
                    <div className="field-label">
                      Job Category <span className="required">*</span>
                    </div>
                    <select
                      className="form-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="">Select category...</option>
                      {JOB_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <div className="field-label">
                      Job Type <span className="required">*</span>
                    </div>
                    <select
                      className="form-select"
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                    >
                      <option value="">Select type...</option>
                      {JOB_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="field-row cols-1">
                  <div className="field">
                    <div className="field-label">
                      Job Description <span className="required">*</span>
                    </div>
                    <textarea
                      className="form-textarea"
                      placeholder="Describe the work, daily duties, and what kind of person you're looking for. Write in simple language."
                      rows={4}
                      maxLength={500}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                    <div className="char-count">{description.length}/500 chars</div>
                  </div>
                </div>
                <div className="field-row cols-1">
                  <div className="field">
                    <div className="field-label">
                      Cover Image <span className="optional">(optional)</span>
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
                          onClick={removeImage}
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
                        onClick={() => document.getElementById("job-image-input")?.click()}
                      >
                        <div className="mu-icon">🖼️</div>
                        <div className="mu-title">Upload a cover image</div>
                        <div className="mu-sub">JPG or PNG, max 5MB</div>
                        <div className="mu-btn">Choose File</div>
                        <input
                          type="file"
                          id="job-image-input"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={handleImageChange}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-title">Pay & Duration</div>
                <div className="field-row cols-1">
                  <div className="field">
                    <div className="field-label">
                      Pay Type <span className="required">*</span>
                    </div>
                    <div className="radio-group">
                      {PAY_TYPES.map((pt) => (
                        <div
                          key={pt.value}
                          className={`radio-pill ${payType === pt.value ? "selected" : ""}`}
                          onClick={() => setPayType(pt.value)}
                        >
                          <span className="pill-icon">{pt.icon}</span>
                          {pt.value}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="field-row cols-2">
                  <div className="field">
                    <div className="field-label">
                      Minimum Pay <span className="required">*</span>
                    </div>
                    <div className="input-wrap suffix">
                      <span className="input-prefix">₹</span>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="12,000"
                        value={payMin}
                        onChange={(e) => setPayMin(e.target.value)}
                      />
                      <span className="input-suffix">
                        {PAY_TYPES.find((pt) => pt.value === payType)?.suffix || "/mo"}
                      </span>
                    </div>
                  </div>
                  <div className="field">
                    <div className="field-label">
                      Maximum Pay <span className="optional">(optional)</span>
                    </div>
                    <div className="input-wrap suffix">
                      <span className="input-prefix">₹</span>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="18,000"
                        value={payMax}
                        onChange={(e) => setPayMax(e.target.value)}
                      />
                      <span className="input-suffix">
                        {PAY_TYPES.find((pt) => pt.value === payType)?.suffix || "/mo"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="field-row cols-2">
                  <div className="field">
                    <div className="field-label">
                      Duration / Notice Period <span className="optional">(optional)</span>
                    </div>
                    <select
                      className="form-select"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    >
                      <option value="">Select duration...</option>
                      <option>Ongoing / Permanent</option>
                      <option>1 Month</option>
                      <option>3 Months</option>
                      <option>6 Months</option>
                      <option>1 Year Contract</option>
                      <option>Project-based</option>
                    </select>
                  </div>
                  <div className="field">
                    <div className="field-label">
                      Vacancies <span className="required">*</span>
                    </div>
                    <div className="input-wrap">
                      <span className="input-prefix">👤</span>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="2"
                        min="1"
                        value={vacancies}
                        onChange={(e) => setVacancies(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-title">Location & Benefits</div>
                <div className="field-row cols-1">
                  <div className="field">
                    <div className="field-label">
                      Work Location <span className="required">*</span>
                    </div>
                    <div className="location-row">
                      <div className="input-wrap" style={{ flex: 1 }}>
                        <span className="input-prefix">📍</span>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Area, Neighborhood — e.g. Hadapsar, Pune"
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
                      Benefits & Perks <span className="optional">(select all that apply)</span>
                    </div>
                    <div className="check-group">
                      {BENEFITS.map((benefit) => (
                        <div
                          key={benefit.label}
                          className={`check-pill ${selectedBenefits.includes(benefit.label) ? "selected" : ""}`}
                          onClick={() => toggleBenefit(benefit.label)}
                        >
                          <span className="pill-icon">{benefit.icon}</span>
                          {benefit.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Requirements */}
        {currentStep === 2 && (
          <div className="form-card slide-up">
            <div className="form-card-header">
              <div>
                <div className="fch-title">Requirements</div>
                <div className="fch-sub">Who are you looking for?</div>
              </div>
              <div className="fch-badge job">💼 Step 2 of 3</div>
            </div>
            <div className="form-body">
              <div className="form-section">
                <div className="section-title">Experience & Skills</div>
                <div className="field-row cols-2">
                  <div className="field">
                    <div className="field-label">
                      Experience Required <span className="required">*</span>
                    </div>
                    <select
                      className="form-select"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                    >
                      <option value="">Select experience...</option>
                      <option>Fresher / No Experience</option>
                      <option>6 months – 1 year</option>
                      <option>1–3 years</option>
                      <option>3–5 years</option>
                      <option>5+ years</option>
                    </select>
                  </div>
                  <div className="field">
                    <div className="field-label">
                      Education Level <span className="optional">(optional)</span>
                    </div>
                    <select
                      className="form-select"
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                    >
                      <option value="">Any</option>
                      <option>No minimum required</option>
                      <option>Class 8 pass</option>
                      <option>Class 10 pass</option>
                      <option>Class 12 pass</option>
                      <option>ITI / Diploma</option>
                      <option>Graduate</option>
                    </select>
                  </div>
                </div>
                <div className="field-row cols-1">
                  <div className="field">
                    <div className="field-label">Required Skills</div>
                    <div className="tag-input-wrap">
                      {skills.map((skill) => (
                        <div key={skill} className="tag-chip">
                          {skill}
                          <span
                            className="tag-chip-x"
                            onClick={() => removeSkill(skill)}
                          >
                            ×
                          </span>
                        </div>
                      ))}
                      <input
                        type="text"
                        id="skill-input"
                        placeholder="Type and press Enter..."
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={addSkill}
                      />
                    </div>
                    <div className="field-hint">
                      Press Enter after each skill. E.g. Welding, Electrical wiring, Driving
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-title">Language & Communication</div>
                <div className="field-row cols-1">
                  <div className="field">
                    <div className="field-label">
                      Languages Accepted <span className="required">*</span>
                    </div>
                    <div className="check-group">
                      {LANGUAGES.map((lang) => (
                        <div
                          key={lang}
                          className={`check-pill ${languages.includes(lang) ? "selected" : ""}`}
                          onClick={() => toggleLanguage(lang)}
                        >
                          {lang === "Hindi" && <span className="pill-icon">🗣️</span>}
                          {lang}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-title">Contact & Apply Settings</div>
                <div className="field-row cols-2">
                  <div className="field">
                    <div className="field-label">
                      How to Apply <span className="required">*</span>
                    </div>
                    <select
                      className="form-select"
                      value={applyMethod}
                      onChange={(e) => setApplyMethod(e.target.value)}
                    >
                      <option value="">Select method...</option>
                      <option>Apply on Platform</option>
                      <option>Call / WhatsApp</option>
                      <option>Walk-in Interview</option>
                    </select>
                  </div>
                  <div className="field">
                    <div className="field-label">
                      Application Deadline <span className="optional">(optional)</span>
                    </div>
                    <div className="input-wrap">
                      <span className="input-prefix">📅</span>
                      <input
                        type="date"
                        className="form-input"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Reach & Boost */}
        {currentStep === 3 && (
          <div className="form-card slide-up">
            <div className="form-card-header">
              <div>
                <div className="fch-title">Reach & Boost</div>
                <div className="fch-sub">Decide who sees your job and how prominently</div>
              </div>
              <div className="fch-badge job">💼 Step 3 of 3</div>
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
                        className={`card-radio ${postTo === "global" ? "selected" : ""}`}
                        onClick={() => setPostTo("global")}
                      >
                        <div className="cr-check">✓</div>
                        <span className="cr-icon">🌐</span>
                        <div className="cr-label">Global Feed</div>
                        <div className="cr-desc">Visible to all registered workers in Pune</div>
                      </div>
                      <div
                        className={`card-radio ${postTo === "community" ? "selected" : ""}`}
                        onClick={() => setPostTo("community")}
                      >
                        <div className="cr-check">✓</div>
                        <span className="cr-icon">👥</span>
                        <div className="cr-label">Community Only</div>
                        <div className="cr-desc">Only visible to circle members you target</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {postTo === "community" && (
                <div className="form-section">
                  <div className="section-title">Community Reach Boost</div>
                  <div className="boost-section">
                    <div className="boost-section-header">
                      <div className="bsh-icon">🌾</div>
                      <div>
                        <div className="bsh-title">Target Community Workers Directly</div>
                        <div className="bsh-sub">
                          Your job appears in their community feed with a trusted badge
                        </div>
                      </div>
                      <div className="bsh-toggle">
                        <div
                          className={`toggle-switch ${boostEnabled ? "on" : ""}`}
                          onClick={() => setBoostEnabled(!boostEnabled)}
                        />
                      </div>
                    </div>
                    {boostEnabled && (
                      <div className="boost-section-body visible">
                        <div className="field-row cols-1">
                          <div className="field">
                            <div className="field-label">Target States</div>
                            <div className="boost-state-picker">
                              {["Bihar", "UP", "Odisha", "Bengal", "Rajasthan", "Jharkhand"].map(
                                (state) => (
                                  <div
                                    key={state}
                                    className={`state-pill ${targetStates.includes(state) ? "selected" : ""}`}
                                    onClick={() => {
                                      setTargetStates((prev) =>
                                        prev.includes(state)
                                          ? prev.filter((s) => s !== state)
                                          : [...prev, state]
                                      );
                                    }}
                                  >
                                    {state}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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
              background: "var(--color-danger-light)",
              border: "1px solid var(--color-danger)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-danger)",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Right Column Preview */}
      <div className="right-col">
        <div className="preview-card">
          <div className="pc-header">
            <div className="pch-eyebrow">Preview</div>
            <div className="pch-title">How your job will look</div>
          </div>
          <div className="pc-body">
            <div className="preview-job">
              {imagePreview && (
                <div style={{ position: "relative", marginBottom: "12px" }}>
                  <img
                    src={imagePreview}
                    alt="Job preview"
                    style={{
                      width: "100%",
                      height: "120px",
                      objectFit: "cover",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--fog)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.9)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    📷
                  </div>
                </div>
              )}
              <div className="pj-type">💼 Job</div>
              <div className="pj-title">{title || "Job Title"}</div>
              <div className="pj-company">
                {session?.user?.name || "Your Company"}
              </div>
              {payMin && (
                <div className="pj-grid">
                  <div className="pj-item">
                    <div className="pji-label">Pay</div>
                    <div className="pji-val pay">
                      ₹{payMin}
                      {payMax && ` - ₹${payMax}`}
                      {PAY_TYPES.find((pt) => pt.value === payType)?.suffix}
                    </div>
                  </div>
                  {location && (
                    <div className="pj-item">
                      <div className="pji-label">Location</div>
                      <div className="pji-val">{location}</div>
                    </div>
                  )}
                </div>
              )}
              {skills.length > 0 && (
                <div className="pj-tags">
                  {skills.slice(0, 3).map((skill) => (
                    <span key={skill} className="pj-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
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
              disabled={!title || !category || !jobType || !description || !payMin || !location}
            >
              Next Step →
            </button>
          ) : (
            <button
              type="button"
              className="btn-publish"
              onClick={handleSubmit}
              disabled={loading || !title || !category || !jobType || !description || !payMin || !location}
            >
              {loading ? "Publishing..." : "✓ Publish Job"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
