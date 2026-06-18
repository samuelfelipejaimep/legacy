import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@/lib/supabase/server";
import type { MidasContext } from "@/lib/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

function buildSystemPrompt(ctx: MidasContext): string {
  const objectivesList = ctx.activeObjectives
    .map(
      (o) =>
        `  - ${o.name}: ${Number(o.currentAmount).toFixed(0)}/${Number(
          o.targetAmount
        ).toFixed(0)} ${o.currency} (${(
          (Number(o.currentAmount) / Number(o.targetAmount)) *
          100
        ).toFixed(0)}%)`
    )
    .join("\n");

  return `Eres MIDAS — Market Investment & Digital Asset System — el asistente financiero personal de ${ctx.displayName}.

PERSONALIDAD:
- 70% amigo inteligente que conoce bien el tema
- 20% entrenador que motiva y exige resultados
- 10% analista frío que ve los números con claridad

REGLAS ABSOLUTAS:
1. Nunca señales un problema sin proponer una solución concreta.
2. Sé claro, humano, directo. Nada de jerga técnica innecesaria.
3. No seas alarmista. Los números son datos, no dramas.
4. Si algo va bien, reconócelo. Si algo va mal, dilo sin rodeos y da el siguiente paso.
5. Respuestas cortas cuando la pregunta es simple. Respuestas completas cuando la situación lo requiere.
6. Nunca inventes datos. Si no tienes información, dilo.

CONTEXTO DEL USUARIO:
- Nombre: ${ctx.displayName}
- Nivel LEGACY: ${ctx.level}
- Índice de Control: ${ctx.controlIndex}/100

PATRIMONIO (todo el historial, no solo este mes):
- 👑 Patrimonio Total: $${ctx.patrimonioTotal.toFixed(2)} USD
- ⚡ Liquidez Disponible: $${ctx.liquidezDisponible.toFixed(2)} USD (esto es lo que el usuario puede gastar sin afectar sus misiones ni su escudo financiero)
- 🎯 Capital en Misión: $${ctx.capitalEnMision.toFixed(2)} USD (dinero ya comprometido con misiones activas, no debe contarse como disponible para gastar)
- 🛡️ Escudo Financiero: $${ctx.escudoFinanciero.toFixed(2)} USD (reserva estratégica, no debe contarse como disponible para gastar)

MOVIMIENTO DE ESTE MES:
- Ingresos este mes: $${ctx.monthlyIncome.toFixed(2)} USD
- Gastos este mes: $${ctx.monthlyExpenses.toFixed(2)} USD
- Tasa de ahorro: ${
    ctx.monthlyIncome > 0
      ? (
          ((ctx.monthlyIncome - ctx.monthlyExpenses) /
            ctx.monthlyIncome) *
          100
        ).toFixed(1)
      : 0
  }%

IMPORTANTE PARA TU ANÁLISIS: cuando el usuario pregunte si puede comprar algo, evalúa siempre contra la Liquidez Disponible — no contra el Patrimonio Total. El Capital en Misión y el Escudo Financiero son fondos comprometidos, no son dinero libre para gastar.

OBJETIVOS ACTIVOS:
${objectivesList || "  (Sin objetivos activos)"}

Responde siempre en español. Máximo 3 párrafos en respuestas normales. Para análisis profundos, usa la extensión necesaria.`;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const {
      message,
      conversationId,
      context,
      history,
    } = (await req.json()) as {
      message: string;
      conversationId: string | null;
      context: MidasContext;
      history: { role: string; content: string }[];
    };

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Mensaje vacío" },
        { status: 400 }
      );
    }

    const messages = [
      {
        role: "system" as const,
        content: buildSystemPrompt(context),
      },

      ...history.slice(-10).map((m) => ({
        role:
          m.role === "USER"
            ? ("user" as const)
            : ("assistant" as const),
        content: m.content,
      })),

      {
        role: "user" as const,
        content: message,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    const responseText =
      completion.choices[0]?.message?.content ??
      "No pude generar una respuesta.";

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Perfil no encontrado" },
        { status: 404 }
      );
    }

    let convId = conversationId;

    if (!convId) {
      const conv = await prisma.midasConversation.create({
        data: {
          profileId: profile.id,
          title: message.slice(0, 60),
        },
      });

      convId = conv.id;
    }

    const [, midasMsg] = await prisma.$transaction([
      prisma.midasMessage.create({
        data: {
          conversationId: convId,
          role: "USER",
          content: message,
        },
      }),

      prisma.midasMessage.create({
        data: {
          conversationId: convId,
          role: "MIDAS",
          content: responseText,
        },
      }),
    ]);

    return NextResponse.json({
      response: responseText,
      conversationId: convId,
      messageId: midasMsg.id,
    });
  } catch (error) {
    console.error("MIDAS API error:", error);

    return NextResponse.json(
      {
        response:
          "Hubo un problema técnico. Inténtalo de nuevo.",
        conversationId: null,
        messageId: null,
      },
      { status: 500 }
    );
  }
}