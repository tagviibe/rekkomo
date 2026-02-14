import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const states = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
];

async function main() {
  const hashed = await bcrypt.hash("Password123!", 10);
  const user = await prisma.user.create({
    data: {
      email: "demo@rekkomo.com",
      username: "demo",
      password: hashed,
      name: "Demo User",
      profile: {
        create: {
          originState: "Kerala",
          currentCity: "Bengaluru",
          interests: ["housing", "jobs"],
          languages: ["Malayalam", "English"],
        },
      },
    },
  });

  await prisma.community.createMany({
    data: [
      {
        name: "Malayalis in Bengaluru",
        slug: "malayalis-in-bengaluru",
        type: "INTERSTATE",
        originState: "Kerala",
        destinationState: "Karnataka",
        destinationCity: "Bengaluru",
        description: "For Malayalis living in Bengaluru",
        visibility: "PUBLIC",
      },
      {
        name: "Indians in Dubai",
        slug: "indians-in-dubai",
        type: "GLOBAL",
        originCountry: "India",
        destinationCountry: "UAE",
        destinationCity: "Dubai",
        description: "Connect with Indians in Dubai",
        visibility: "PUBLIC",
      },
    ],
  });

  const community = await prisma.community.findUnique({
    where: { slug: "malayalis-in-bengaluru" },
  });

  if (community) {
    await prisma.communityMember.create({
      data: {
        userId: user.id,
        communityId: community.id,
        status: "APPROVED",
      },
    });
    await prisma.community.update({
      where: { id: community.id },
      data: { memberCount: { increment: 1 } },
    });

    await prisma.post.create({
      data: {
        communityId: community.id,
        authorId: user.id,
        type: "QUESTION",
        title: "Affordable PG options near Koramangala?",
        body: "Looking for safe and affordable PG recommendations near Koramangala for a new move.",
        tags: ["housing", "bengaluru"],
      },
    });
  }

  console.log("Seeded states:", states.length);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
