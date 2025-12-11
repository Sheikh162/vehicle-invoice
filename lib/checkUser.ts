import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const checkUser = async () => {
  const user = await currentUser();

  // 1. Check if user is logged in
  if (!user) {
    return null;
  }

  // 2. Check if user exists in DB
  const loggedInUser = await prisma.user.findUnique({
    where: {
      clerkId: user.id,
    },
  });

  // 3. If user is in DB, return them
  if (loggedInUser) {
    return loggedInUser;
  }

  // 4. If not, create them!
  const newUser = await prisma.user.create({
    data: {
      clerkId: user.id,
      email: user.emailAddresses[0].emailAddress,
      // Add other required fields from your schema if necessary
      // name: `${user.firstName} ${user.lastName}`,
    },
  });

  return newUser;
};