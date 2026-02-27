import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import JobDetailClient from "./JobDetailClient";

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getAuthSession();
  
  const job = await prisma.jobPost.findUnique({
    where: { id: params.id },
    include: {
      employer: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: {
            select: {
              nativePlaceState: true,
              trustScore: true,
              profession: true,
              currentCity: true,
            },
          },
        },
      },
      applications: {
        include: {
          seeker: {
            select: {
              id: true,
              name: true,
              image: true,
              profile: {
                select: {
                  nativePlaceState: true,
                  profession: true,
                  currentCity: true,
                },
              },
            },
          },
        },
        orderBy: {
          appliedAt: "desc",
        },
        take: 10,
      },
      _count: {
        select: {
          applications: true,
        },
      },
    },
  });

  if (!job) {
    notFound();
  }

  const userApplication = session?.user?.id
    ? job.applications.find((app) => app.seekerId === session.user.id)
    : null;

  // Get similar jobs
  const similarJobs = await prisma.jobPost.findMany({
    where: {
      id: { not: job.id },
      status: "OPEN",
      OR: [
        { skillCategory: job.skillCategory },
        { location: { contains: job.location.split(",")[0] } },
      ],
    },
    include: {
      employer: {
        select: {
          name: true,
        },
      },
    },
    take: 3,
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <JobDetailClient
      job={job}
      userApplication={userApplication}
      isAuthenticated={!!session}
      similarJobs={similarJobs}
    />
  );
}
