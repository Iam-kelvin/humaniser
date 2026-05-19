import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import "server-only";

import { assertDatabaseConfigured } from "@/lib/database";
import { prisma } from "@/lib/prisma";

function extractPrimaryEmail(sessionClaims: unknown) {
  if (!sessionClaims || typeof sessionClaims !== "object") {
    return null;
  }

  const claims = sessionClaims as Record<string, unknown>;

  const directEmail =
    typeof claims.email === "string"
      ? claims.email
      : typeof claims.emailAddress === "string"
        ? claims.emailAddress
        : typeof claims.email_address === "string"
          ? claims.email_address
          : null;

  if (directEmail) {
    return directEmail;
  }

  const emailList =
    Array.isArray(claims.email_addresses) ? claims.email_addresses :
    Array.isArray(claims.emailAddresses) ? claims.emailAddresses :
    null;

  if (!emailList?.length) {
    return null;
  }

  const firstEmail = emailList.find((value) => typeof value === "string");
  return typeof firstEmail === "string" ? firstEmail : null;
}

export async function getViewer() {
  const session = await auth();

  if (!session.userId) {
    return null;
  }

  assertDatabaseConfigured();

  const existingUser = await prisma.user.findUnique({
    where: { clerkUserId: session.userId },
    include: {
      profile: true,
      subscription: true,
      customers: true,
    },
  });

  let clerkUser = null;
  let email = extractPrimaryEmail(session.sessionClaims) ?? existingUser?.email ?? null;
  let displayName = existingUser?.profile?.displayName ?? "Writer";

  if (!existingUser || !email) {
    try {
      clerkUser = await currentUser();
      email = clerkUser?.primaryEmailAddress?.emailAddress ?? email;
      displayName =
        [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
        clerkUser?.username ||
        displayName;
    } catch {
      // Fall back to the local user record when Clerk's user profile fetch is temporarily unavailable.
    }
  }

  if (existingUser && (!email || existingUser.email === email)) {
    return {
      session,
      clerkUser,
      user: existingUser,
    };
  }

  if (!email) {
    throw new Error("Signed-in user is missing a primary email address.");
  }

  const user = await prisma.user.upsert({
    where: { clerkUserId: session.userId },
    update: {
      email,
    },
    create: {
      clerkUserId: session.userId,
      email,
      profile: {
        create: {
          displayName,
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
