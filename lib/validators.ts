import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const communityQuerySchema = z.object({
  query: z.string().optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export const createCommunitySchema = z.object({
  name: z.string().min(3),
  slug: z.string().min(3),
  type: z.enum(["INTERSTATE", "GLOBAL"]),
  originCountry: z.string().optional(),
  originState: z.string().optional(),
  originCity: z.string().optional(),
  destinationCountry: z.string().optional(),
  destinationState: z.string().optional(),
  destinationCity: z.string().optional(),
  description: z.string().optional(),
  rules: z.string().optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
});

export const createPostSchema = z.object({
  communityId: z.string().optional(),
  type: z.enum(["QUESTION", "HELP", "RESOURCE", "GENERAL"]),
  title: z.string().min(3),
  body: z.string().min(10),
  imageUrl: z.string().max(500).optional(),
  tags: z.array(z.string()).default([]),
  locationContext: z.string().optional(),
});

export const createCommentSchema = z.object({
  body: z.string().min(2),
  parentId: z.string().optional(),
});

export const reactSchema = z.object({
  type: z.enum(["UPVOTE", "DOWNVOTE", "LIKE", "LOVE", "LAUGH", "WOW"]),
});

export const reportSchema = z.object({
  targetType: z.enum(["POST", "COMMENT", "COMMUNITY", "USER"]),
  targetId: z.string(),
  reason: z.string().min(3),
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export const onboardingSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
  phone: z.string().optional(),
  originCountry: z.string().optional(),
  originState: z.string().optional(),
  originCity: z.string().optional(),
  currentCountry: z.string().optional(),
  currentState: z.string().optional(),
  currentCity: z.string().min(2),
  currentLocality: z.string().optional(),
  nativePlace: z.string().optional(),
  nativePlaceCity: z.string().optional(),
  nativePlaceState: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_SAY"]).optional(),
  dateOfBirth: z.string().optional(),
  languagesSpoken: z.array(z.string()).min(1),
  profession: z.enum([
    "STUDENT",
    "IT_PROFESSIONAL",
    "JOB_SEEKER",
    "FREELANCER",
    "BUSINESS_OWNER",
    "OTHER",
  ]),
  movedToCityWhen: z.enum(["MONTHS_0_3", "MONTHS_3_12", "YEAR_1_PLUS"]).optional(),
  needs: z.array(z.string()).min(1),
  canOffer: z.array(z.string()).default([]),
  communities: z.array(z.string()).max(15).default([]),
  interests: z.array(z.string()).max(15).default([]),
  languages: z.array(z.string()).max(10).default([]),
  showEmail: z.boolean().default(false),
  showPhone: z.boolean().default(false),
  showApproxLocation: z.boolean().default(true),
  profileVisibility: z.enum(["PUBLIC", "COMMUNITY_ONLY", "PRIVATE"]).default("COMMUNITY_ONLY"),
  showNativePlace: z.boolean().default(true),
  showActivity: z.boolean().default(true),
  allowFollow: z.boolean().default(true),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  image: z.string().max(500).optional(),
  bio: z.string().max(500).optional(),
  phone: z.string().optional(),
  originCountry: z.string().optional(),
  originState: z.string().optional(),
  originCity: z.string().optional(),
  currentCountry: z.string().optional(),
  currentState: z.string().optional(),
  currentCity: z.string().optional(),
  currentLocality: z.string().optional(),
  nativePlace: z.string().optional(),
  nativePlaceCity: z.string().optional(),
  nativePlaceState: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_SAY"]).optional(),
  dateOfBirth: z.string().optional(),
  languagesSpoken: z.array(z.string()).max(10).optional(),
  profession: z.enum([
    "STUDENT",
    "IT_PROFESSIONAL",
    "JOB_SEEKER",
    "FREELANCER",
    "BUSINESS_OWNER",
    "OTHER",
  ]).optional(),
  movedToCityWhen: z.enum(["MONTHS_0_3", "MONTHS_3_12", "YEAR_1_PLUS"]).optional(),
  needs: z.array(z.string()).max(15).optional(),
  canOffer: z.array(z.string()).max(15).optional(),
  interests: z.array(z.string()).max(15).optional(),
  languages: z.array(z.string()).max(10).optional(),
  communities: z.array(z.string()).max(15).optional(),
  showEmail: z.boolean().optional(),
  showPhone: z.boolean().optional(),
  showApproxLocation: z.boolean().optional(),
  profileVisibility: z.enum(["PUBLIC", "COMMUNITY_ONLY", "PRIVATE"]).optional(),
  showNativePlace: z.boolean().optional(),
  showActivity: z.boolean().optional(),
  allowFollow: z.boolean().optional(),
});
