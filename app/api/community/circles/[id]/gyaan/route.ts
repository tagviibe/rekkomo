import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { sanitizeText } from "@/lib/sanitize";
import { z } from "zod";

const createGyaanSchema = z.object({
  title: z.string().min(1),
  category: z.string(),
  content: z.string().min(1),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  // Verify user is a member
  const membership = await prisma.circleMembership.findUnique({
    where: {
      circleId_userId: {
        circleId: params.id,
        userId: session.user.id,
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const where: any = {
    circleId: params.id,
  };

  if (category && category !== "all") {
    where.category = category;
  }

  const entries = await prisma.gyaanEntry.findMany({
    where,
    include: {
      post: {
        include: {
          author: {
            include: {
              profile: {
                select: {
                  trustScore: true,
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          upvotes: true,
        },
      },
    },
    orderBy: [
      { isPinned: "desc" },
      { upvoteCount: "desc" },
      { createdAt: "desc" },
    ],
  });

  // Filter by search if provided
  let filtered = entries;
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = entries.filter(
      (e) =>
        e.title.toLowerCase().includes(searchLower) ||
        e.post.content.toLowerCase().includes(searchLower)
    );
  }

  return NextResponse.json({ entries: filtered });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createGyaanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Verify user is a member
  const membership = await prisma.circleMembership.findUnique({
    where: {
      circleId_userId: {
        circleId: params.id,
        userId: session.user.id,
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  // Create post first
  const post = await prisma.communityPost.create({
    data: {
      circleId: params.id,
      authorId: session.user.id,
      type: "GYAAN",
      content: sanitizeText(parsed.data.content),
      mediaUrls: [],
    },
  });

  // Create gyaan entry
  const entry = await prisma.gyaanEntry.create({
    data: {
      circleId: params.id,
      postId: post.id,
      authorId: session.user.id,
      title: sanitizeText(parsed.data.title),
      category: parsed.data.category,
    },
    include: {
      post: {
        include: {
          author: {
            include: {
              profile: {
                select: {
                  trustScore: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ entry }, { status: 201 });
}
