import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ObjectiveForm } from "@/components/objectives/objective-form";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const obj = await prisma.objective.findUnique({ where: { id } });
  return { title: `Editar: ${obj?.name ?? "Objetivo"}` };
}

export default async function EditarObjetivoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/login");

  const objective = await prisma.objective.findUnique({ where: { id } });
  if (!objective || objective.profileId !== profile.id) notFound();

  // Don't allow editing completed or cancelled objectives
  if (objective.status === "COMPLETED" || objective.status === "CANCELLED") {
    redirect(`/objetivos/${id}`);
  }

  return (
    <div className="space-y-6 max-w-lg">
      <Link
        href={`/objetivos/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> {objective.name}
      </Link>

      <div>
        <h1 className="text-xl font-bold text-white">Editar Misión</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Actualiza los datos de tu objetivo.
        </p>
      </div>

      <ObjectiveForm profileId={profile.id} objective={objective as any} />
    </div>
  );
}
