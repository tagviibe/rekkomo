const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Cleaning up all posts and creating new users...\n");

  try {
    // Step 1: Delete all related post data
    console.log("Step 1: Deleting post-related data...");
    
    // Delete in order to respect foreign key constraints
    await prisma.postLike.deleteMany({});
    console.log("  ✅ Deleted PostLikes");
    
    await prisma.postReply.deleteMany({});
    console.log("  ✅ Deleted PostReplies");
    
    await prisma.sOSRequest.deleteMany({});
    console.log("  ✅ Deleted SOSRequests");
    
    await prisma.meetup.deleteMany({});
    console.log("  ✅ Deleted Meetups");
    
    await prisma.gyaanEntry.deleteMany({});
    console.log("  ✅ Deleted GyaanEntries");
    
    // Finally delete posts
    await prisma.communityPost.deleteMany({});
    console.log("  ✅ Deleted CommunityPosts");
    
    console.log("\n✅ All posts cleaned up!\n");

    // Step 2: Get existing circles to add users to
    console.log("Step 2: Finding circles to add users to...");
    
    // Find Odisha circles first, then fallback to any circle
    let circles = await prisma.circle.findMany({
      where: {
        OR: [
          { name: { contains: "Odisha" } },
          { state: "Odisha" },
        ],
      },
      orderBy: { memberCount: "desc" },
    });
    
    // If no Odisha circles, get any circles
    if (circles.length === 0) {
      circles = await prisma.circle.findMany({
        take: 5,
        orderBy: { memberCount: "desc" },
      });
    }
    
    if (circles.length === 0) {
      console.log("  ⚠️  No circles found. Please create a circle first.");
      return;
    }
    
    console.log(`  ✅ Found ${circles.length} circle(s)`);
    circles.forEach((circle, idx) => {
      console.log(`     ${idx + 1}. ${circle.name} (${circle.level}) - ${circle.memberCount} members`);
    });
    
    const targetCircle = circles[0]; // Use the first circle
    console.log(`\n  📍 Using circle: ${targetCircle.name} (ID: ${targetCircle.id})\n`);

    // Step 3: Create new test users
    console.log("Step 3: Creating new test users...\n");

    const testUsers = [
      {
        email: "rajat.kumar@test.com",
        password: "Test@123",
        name: "Rajat Kumar",
        phone: "+919876543210",
        username: "rajatkumar",
        currentCity: "Pune",
        currentState: "Maharashtra",
        nativePlaceState: "Odisha",
        nativePlaceCity: "Bhubaneswar",
        profession: "IT_PROFESSIONAL",
        bio: "Software developer from Odisha, working in Pune. Love helping community members.",
      },
      {
        email: "priya.yadav@test.com",
        password: "Test@123",
        name: "Priya Yadav",
        phone: "+919876543211",
        username: "priyayadav",
        currentCity: "Pune",
        currentState: "Maharashtra",
        nativePlaceState: "Uttar Pradesh",
        nativePlaceCity: "Lucknow",
        profession: "OTHER",
        bio: "Community helper and service provider. Always ready to assist Odisha/UP community members.",
      },
      {
        email: "amit.singh@test.com",
        password: "Test@123",
        name: "Amit Singh",
        phone: "+919876543212",
        username: "amitsingh",
        currentCity: "Pune",
        currentState: "Maharashtra",
        nativePlaceState: "Odisha",
        nativePlaceCity: "Cuttack",
        profession: "OTHER",
        bio: "Electrician and community member. Available for service inquiries.",
      },
      {
        email: "sunita.devi@test.com",
        password: "Test@123",
        name: "Sunita Devi",
        phone: "+919876543213",
        username: "sunitadevi",
        currentCity: "Pune",
        currentState: "Maharashtra",
        nativePlaceState: "Odisha",
        nativePlaceCity: "Rourkela",
        profession: "OTHER",
        bio: "Registered nurse from Odisha. Happy to help community members with health queries.",
      },
      {
        email: "vijay.kumar@test.com",
        password: "Test@123",
        name: "Vijay Kumar",
        phone: "+919876543214",
        username: "vijaykumar",
        currentCity: "Pune",
        currentState: "Maharashtra",
        nativePlaceState: "Uttar Pradesh",
        nativePlaceCity: "Varanasi",
        profession: "OTHER",
        bio: "Professional plumber. Serving Odisha/UP community in Pune.",
      },
    ];

    const createdUsers = [];

    for (const userData of testUsers) {
      try {
        // Delete existing user if exists (cascade will handle related data)
        const existing = await prisma.user.findUnique({
          where: { email: userData.email },
        });

        if (existing) {
          console.log(`  🗑️  Deleting existing user: ${userData.email}`);
          // Delete memberships first due to foreign key constraints
          await prisma.circleMembership.deleteMany({
            where: { userId: existing.id },
          });
          await prisma.user.delete({
            where: { id: existing.id },
          });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // Create user with profile
        const user = await prisma.user.create({
          data: {
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            username: userData.username,
            profile: {
              create: {
                phone: userData.phone,
                currentCity: userData.currentCity,
                currentState: userData.currentState,
                nativePlaceState: userData.nativePlaceState,
                nativePlaceCity: userData.nativePlaceCity,
                profession: userData.profession,
                bio: userData.bio,
                languages: ["Hindi", "English"],
                languagesSpoken: ["Hindi", "English"],
                showPhone: true,
                onboardingCompleted: true,
                trustScore: Math.floor(Math.random() * 50) + 20, // Random trust score 20-70
              },
            },
          },
          include: {
            profile: true,
          },
        });

        console.log(`  ✅ Created user: ${userData.name} (${user.email})`);

        // Add user to the circle matching their currentCity
        try {
          // Find or create circle for user's city and native state
          let userCircle = await prisma.circle.findFirst({
            where: {
              state: userData.nativePlaceState,
              city: userData.currentCity,
              level: "STATE",
            },
          });

          if (!userCircle) {
            // Create circle if it doesn't exist
            userCircle = await prisma.circle.create({
              data: {
                name: `${userData.nativePlaceState} Circle — ${userData.currentCity}`,
                level: "STATE",
                state: userData.nativePlaceState,
                city: userData.currentCity,
                memberCount: 0,
              },
            });
            console.log(`     ✅ Created circle: ${userCircle.name}`);
          }

          await prisma.circleMembership.create({
            data: {
              circleId: userCircle.id,
              userId: user.id,
              joinedAt: new Date(),
            },
          });
          console.log(`     ✅ Added to circle: ${userCircle.name}`);
        } catch (error) {
          if (error.code === "P2002") {
            console.log(`     ⚠️  Already a member of circle`);
          } else {
            console.log(`     ⚠️  Could not add to circle: ${error.message}`);
          }
        }

        createdUsers.push({
          ...userData,
          id: user.id,
        });
      } catch (error) {
        console.error(`  ❌ Error creating user ${userData.email}:`, error.message);
      }
    }

    // Step 4: Update circle member counts for all circles users were added to
    const allCircles = await prisma.circle.findMany({
      where: {
        OR: [
          { name: { contains: "Odisha" } },
          { name: { contains: "Uttar Pradesh" } },
        ],
      },
    });

    for (const circle of allCircles) {
      const memberCount = await prisma.circleMembership.count({
        where: { circleId: circle.id },
      });
      
      await prisma.circle.update({
        where: { id: circle.id },
        data: { memberCount },
      });
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ SUMMARY");
    console.log("=".repeat(60));
    console.log(`\n📊 Posts cleaned: All CommunityPosts and related data deleted`);
    console.log(`\n👥 Created ${createdUsers.length} users:`);
    createdUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Phone: ${user.phone}`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Circle: ${targetCircle.name}`);
      console.log(`   Profile: http://localhost:3000/profile/${user.id}`);
    });

    console.log(`\n📍 Circles updated:`);
    for (const circle of allCircles) {
      const count = await prisma.circleMembership.count({
        where: { circleId: circle.id },
      });
      console.log(`   ${circle.name}: ${count} members`);
      console.log(`   URL: http://localhost:3000/community/${circle.id}`);
    }

    console.log("\n✅ All users can login with password: Test@123");
  } catch (error) {
    console.error("\n❌ Error:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
