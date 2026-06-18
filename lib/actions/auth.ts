"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/types";

export async function loginAction(
  email: string,
  password: string
): Promise<ActionResult> {
  const supabase = await createServerClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function signupAction(
  email: string,
  password: string,
  displayName: string
): Promise<ActionResult> {
  const supabase = await createServerClient();

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data.user) {
    await prisma.profile.upsert({
      where: { userId: data.user.id },
      update: {},
      create: {
        userId: data.user.id,
        displayName,
        level: 1,
        xp: 0,
        controlIndex: 0,
      },
    });
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function logoutAction(): Promise<void> {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getCurrentUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
