import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ObjectiveForm } from "@/components/objectives/objective-form";

export const metadata = { title: "Nueva Misión" };

export default async function NuevoObjetivoPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/login");

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-xl font-bold text-white">Nueva Misión</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Define tu próximo objetivo financiero.
        </p>
      </div>
      <ObjectiveForm profileId={profile.id} />
    </div>
  );
}
