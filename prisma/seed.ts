import { PrismaClient, Prisma } from "../app/generated/prisma/client";
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({
  adapter,
});

// Define the data for Users and their Vehicles
const userData: Prisma.UserCreateInput[] = [
  {
    // IMPORTANT: Replace this with your ACTUAL Clerk User ID from the Clerk Dashboard
    // if you want to see this data when you log in.
    clerkId: "user_36Yn5VsWurCzfVUjgvua1dhBTAA", 
    email: "sheikhabdullah.aka@gmail.com",
    vehicles: {
      create: [
        {
          make: "Toyota",
          model: "Fortuner",
          regNumber: "MH-02-AZ-1234",
        },
        {
          make: "Honda",
          model: "City",
          regNumber: "MH-04-CD-5678",
        },
      ],
    },
  },
];

export async function main() {
  console.log(`Start seeding ...`)
  for (const u of userData) {
    // We use upsert here to avoid errors if you run the seed script twice
    // It creates the user if they don't exist, or updates them if they do
    const user = await prisma.user.upsert({
      where: { clerkId: u.clerkId },
      update: {},
      create: u,
    })
    console.log(`Created user with id: ${user.id}`)
  }
  console.log(`Seeding finished.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })