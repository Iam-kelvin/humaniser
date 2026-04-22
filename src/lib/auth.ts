import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import "server-only";

import { prisma } from "@/lib/prisma";

export async function getViewer() {
  const session = await auth();

  if (!session.userId) {
    return null;
  }

  const clerkUser = await currentUser();

  if (!clerkUser?.primaryEmailAddress?.emailAddress) {
    throw new Error("Signed-in user is missing a primary email address.");
  }

  const user = await prisma.user.upsert({
    where: { clerkUserId: session.userId },
    update: {
      email: clerkUser.primaryEmailAddress.emailAddress,
    },
    create: {
      clerkUserId: session.userId,
      email: clerkUser.primaryEmailAddress.emailAddress,
      profile: {
        create: {
          displayName: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || clerkUser.username || "Writer",
        },
      },
    },
    include: {
      profile: true,
      subscription: true,
      customers: true,
    },
  });

  return {
    session,
    clerkUser,
    user,
  };
}

export async function requireViewer() {
  const viewer = await getViewer();

  if (!viewer) {
    redirect("/sign-in");
  }

  return viewer;
}
