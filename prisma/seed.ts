// prisma/seed.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create Admin user
  const admin = await prisma.user.upsert({
    where: { nationalId: "0000000000000" },
    update: {},
    create: {
      nationalId: "0000000000000",
      firstName: "Admin",
      lastName: "System",
      address: "System Administrator",
      role: "ADMIN",
      constituency: {
        connectOrCreate: {
          where: {
            province_districtNumber: {
              province: "Bangkok",
              districtNumber: 1,
            },
          },
          create: {
            province: "Bangkok",
            districtNumber: 1,
          },
        },
      },
    },
  });

  console.log("✅ Admin user created:");
  console.log({
    nationalId: admin.nationalId,
    name: `${admin.firstName} ${admin.lastName}`,
    role: admin.role,
  });

  console.log("\n🎉 Seeding completed successfully!");
  console.log("\n📝 Admin Credentials:");
  console.log("   National ID: 0000000000000");
  console.log("   Role: ADMIN");
  console.log("\n💡 Use this to login and get admin token:");
  console.log("   curl -X POST http://localhost:3000/api/auth/login \\");
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"nationalId": "0000000000000"}\'');
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
