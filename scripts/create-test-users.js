const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Creating 3 test users with mobile numbers...\n");

  const testUsers = [
    {
      email: "rajat.kumar@test.com",
      password: "Test@123",
      name: "Rajat Kumar",
      phone: "+919876543210",
      username: "rajatkumar",
      currentCity: "Pune",
      currentState: "Maharashtra",
      originState: "Odisha",
      originCity: "Patna",
      bio: "Software developer from Odisha, working in Pune. Love helping community members.",
    },
    {
      email: "priya.yadav@test.com",
      password: "Test@123",
      name: "Priya Yadav",
      phone: "+919876543211",
      username: "priyayadav",
      currentCity: "Mumbai",
      currentState: "Maharashtra",
      originState: "Uttar Pradesh",
      originCity: "Lucknow",
      bio: "Community helper and service provider. Always ready to assist Odisha/UP community members.",
    },
    {
      email: "amit.singh@test.com",
      password: "Test@123",
      name: "Amit Singh",
      phone: "+919876543212",
      username: "amitsingh",
      currentCity: "Bangalore",
      currentState: "Karnataka",
      originState: "Odisha",
      originCity: "Gaya",
      bio: "Electrician and community member. Available for service inquiries.",
    },
  ];

  const createdUsers = [];

  for (const userData of testUsers) {
    try {
      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existing) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
        createdUsers.push({
          ...userData,
          id: existing.id,
          status: "existing",
        });
        continue;
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
              originState: userData.originState,
              originCity: userData.originCity,
              bio: userData.bio,
              languages: ["Hindi", "English"],
              languagesSpoken: ["Hindi", "English"],
              showPhone: true,
              onboardingCompleted: true,
            },
          },
        },
        include: {
          profile: true,
        },
      });

      console.log(`✅ Created user: ${userData.name}`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   Phone: ${userData.phone}`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Profile ID: ${user.profile ? user.profile.id : "N/A"}\n`);

      createdUsers.push({
        ...userData,
        id: user.id,
        status: "created",
      });
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error.message);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log("\nCreated/Found Users:\n");

  createdUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${user.password}`);
    console.log(`   Phone: ${user.phone}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Status: ${user.status === "created" ? "✅ Created" : "⚠️  Already existed"}`);
    console.log(`   Profile URL: http://localhost:3000/profile/${user.id}`);
    console.log("");
  });

  console.log("\nYou can now login with any of these accounts!");
  console.log("All passwords are: Test@123");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
