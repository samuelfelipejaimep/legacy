import { PrismaClient, Currency } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "Ingresos", icon: "💵", color: "#10B981" },
  { name: "Relationship", icon: "💑", color: "#FF6B6B" },
  { name: "Familia", icon: "👨‍👩‍👧‍👦", color: "#FF9F43" },
  { name: "Amigos", icon: "👫", color: "#F9CA24" },
  { name: "Mercado", icon: "🛒", color: "#6AB04C" },
  { name: "Comida", icon: "🍽️", color: "#22A6B3" },
  { name: "Transporte", icon: "🚗", color: "#7ED6DF" },
  { name: "Servicios", icon: "⚡", color: "#686DE0" },
  { name: "Entretenimiento", icon: "🎮", color: "#BE2EDD" },
  { name: "Viajes", icon: "✈️", color: "#4834D4" },
  { name: "Compras Personales", icon: "🛍️", color: "#EB3B5A" },
  { name: "Inversiones", icon: "📈", color: "#20BF6B" },
  { name: "Capital de Ataque", icon: "⚔️", color: "#3867D6" },
  { name: "Zona de Riesgo", icon: "⚠️", color: "#E74C3C" },
];

const INITIAL_OBJECTIVES = [
  {
    name: "MX-5 Protocol",
    subtitle: "Mazda Miata MX-5 2026",
    targetAmount: 175_000_000,
    currency: Currency.COP,
    priority: 1,
    xpReward: 5000,
  },
  {
    name: "Upgrade Profesional",
    subtitle: "MacBook Air para trabajo y productividad",
    targetAmount: 1700,
    currency: Currency.USD,
    priority: 2,
    xpReward: 500,
  },
  {
    name: "Misión Caribe",
    subtitle: "Crucero Royal Caribbean para mis padres",
    targetAmount: 4000,
    currency: Currency.USD,
    priority: 3,
    xpReward: 1000,
  },
  {
    name: "Deuda de Honor",
    subtitle: "Pago completo de deuda familiar",
    targetAmount: 2_000_000,
    currency: Currency.COP,
    priority: 4,
    xpReward: 2000,
  },
  {
    name: "Capital de Ataque",
    subtitle: "Reinversión para crecimiento del negocio",
    targetAmount: 10_000,
    currency: Currency.USD,
    priority: 5,
    xpReward: 3000,
  },
];

async function main() {
  console.log("🌱 Sembrando base de datos LEGACY...");

  // Seed categories
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { ...cat, isDefault: true, isSystem: true },
    });
  }
  console.log(`  ✅ ${CATEGORIES.length} categorías`);

  // Seed objectives for existing profiles (run after first login)
  const profiles = await prisma.profile.findMany();
  for (const profile of profiles) {
    const existing = await prisma.objective.count({ where: { profileId: profile.id } });
    if (existing === 0) {
      for (const obj of INITIAL_OBJECTIVES) {
        await prisma.objective.create({
          data: { ...obj, profileId: profile.id },
        });
      }
      console.log(`  ✅ 6 objetivos creados para ${profile.displayName}`);
    }
  }

  console.log("\n🚀 Base de datos lista.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
