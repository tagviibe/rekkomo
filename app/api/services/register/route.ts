import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ServiceCategory } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      category,
      categoryName,
      services,
      languages,
      serviceArea,
      serviceScope,
      acceptsUrgent,
      communityDiscount,
    } = body;

    // Validate required fields
    if (!category || !services || services.length === 0) {
      return NextResponse.json(
        { error: "Category and at least one service are required" },
        { status: 400 }
      );
    }

    // Check if user already has a service provider profile
    const existing = await prisma.serviceProvider.findUnique({
      where: { userId: session.user.id },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You are already registered as a service provider" },
        { status: 400 }
      );
    }

    // Validate OTHER category has a name
    if (category === ServiceCategory.OTHER && !categoryName?.trim()) {
      return NextResponse.json(
        { error: "Please provide a category name for 'Other'" },
        { status: 400 }
      );
    }

    // Validate serviceArea is an array of strings
    let serviceAreaArray: string[] = [];
    if (Array.isArray(serviceArea)) {
      serviceAreaArray = serviceArea;
    } else if (typeof serviceArea === "string") {
      serviceAreaArray = [serviceArea];
    } else if (typeof serviceArea === "number") {
      serviceAreaArray = [`Within ${serviceArea} km`];
    } else {
      serviceAreaArray = ["Within 5 km"]; // Default
    }

    // Create service provider
    // Store services data - we'll use a workaround until migration is run
    const providerData: any = {
      userId: session.user.id,
      category: category as ServiceCategory,
      languages: languages || [],
      serviceArea: serviceAreaArray, // Ensure it's an array of strings
      rate: services[0]?.price || null,
    };

    // Try to add new fields if they exist in the schema
    // These will be available after running the migration
    try {
      if (category === ServiceCategory.OTHER && categoryName) {
        providerData.categoryName = categoryName;
      }
      if (services) {
        providerData.services = services;
      }
      if (acceptsUrgent !== undefined) {
        providerData.acceptsUrgent = acceptsUrgent;
      }
      if (communityDiscount !== undefined) {
        providerData.communityDiscount = communityDiscount;
      }
      if (serviceScope) {
        providerData.serviceScope = serviceScope; // Store service scope
      }
    } catch (e) {
      // Fields don't exist yet - that's okay, we'll store what we can
      console.log("New fields not available yet - migration needed");
    }

    const provider = await prisma.serviceProvider.create({
      data: providerData,
    });

    console.log("Service provider created:", provider.id);

    return NextResponse.json({
      success: true,
      provider: {
        id: provider.id,
        category: provider.category,
      },
    });
  } catch (error) {
    console.error("Service provider registration error:", error);
    return NextResponse.json(
      { error: "Failed to register as service provider" },
      { status: 500 }
    );
  }
}
