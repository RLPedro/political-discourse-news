import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TOPICS = ["climate", "economy", "policy", "safety"] as const;
type Topic = (typeof TOPICS)[number];

const COUNTRIES = ["SE", "PT"] as const;
type Country = (typeof COUNTRIES)[number];

const BASE_SENTIMENT: Record<Topic, number> = {
  climate: 0.65,
  economy: 0.5,
  policy: 0.45,
  safety: 0.55,
};

const SOURCES: Record<Country, string[]> = {
  SE: ["SVT.se", "DN.se", "Aftonbladet.se", "Sveriges Radio"],
  PT: ["Publico.pt", "Observador.pt", "JN.pt", "Expresso.pt"],
};

const ENTITIES = [
  { name: "Government", type: "organization" },
  { name: "Economy", type: "topic" },
  { name: "Environment", type: "topic" },
  { name: "Security", type: "topic" },
];

const TOPIC_ENTITY: Record<Topic, string> = {
  climate: "Environment",
  economy: "Economy",
  policy: "Government",
  safety: "Security",
};

const clamp = (x: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, x));
}

const randomSentiment = (topic: Topic): number => {
  const base = BASE_SENTIMENT[topic];
  const noise = (Math.random() - 0.5) * 0.2; // ±0.1
  const val = clamp(base + noise, 0.15, 0.9);
  return Number(val.toFixed(3));
}

const main = async () => {
  console.log("🌱 Seeding expanded mock data...");

  await prisma.entityOccurrence.deleteMany();
  await prisma.analysis.deleteMany();
  await prisma.article.deleteMany();
  await prisma.entity.deleteMany();

  const entityRecords = await Promise.all(
    ENTITIES.map((e) => prisma.entity.create({ data: e }))
  );

  const entityByName = new Map(
    entityRecords.map((e) => [e.name, e])
  );

  const DAYS = 60;

  const now = new Date();

  for (const country of COUNTRIES) {
    for (let offset = 0; offset < DAYS; offset++) {
      const date = new Date(
        now.getTime() - offset * 24 * 60 * 60 * 1000
      );

      for (const topic of TOPICS) {
        const sources = SOURCES[country];
        const source =
          sources[Math.floor(Math.random() * sources.length)];

        const title = `${topic.toUpperCase()} update in ${
          country === "SE" ? "Sweden" : "Portugal"
        } (${date.toISOString().slice(0, 10)})`;

        const url = `https://example.com/${country.toLowerCase()}/${topic}/${date
          .toISOString()
          .slice(0, 10)}`;

        const rawText = `Mock article about ${topic} in ${
          country === "SE" ? "Sweden" : "Portugal"
        } on ${date.toDateString()}.`;

        const article = await prisma.article.create({
          data: {
            source,
            title,
            url,
            publishedAt: date,
            rawText,
            country,
          },
        });

        const sentiment = randomSentiment(topic);

        const entityName = TOPIC_ENTITY[topic];
        const entity = entityByName.get(entityName);

        const analysis = await prisma.analysis.create({
          data: {
            articleId: article.id,
            sentiment,
            topics: [topic],
            entities: entity ? [entity.name] : [],
          },
        });

        if (entity) {
          await prisma.entityOccurrence.create({
            data: {
              entityId: entity.id,
              analysisId: analysis.id,
              count: 1,
            },
          });
        }
      }
    }
  }

  console.log("🌱 Expanded mock data inserted successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
