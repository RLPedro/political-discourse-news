import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const main = async () => {
  console.log("🌱 Seeding mock data...");

  // Clear existing (optional, comment out if you want to keep data)
//   await prisma.entityOccurrence.deleteMany();
//   await prisma.analysis.deleteMany();
//   await prisma.article.deleteMany();
//   await prisma.entity.deleteMany();

  // Predefined entities
  const entities = [
    { name: "Government", type: "organization" },
    { name: "Economy", type: "topic" },
    { name: "Environment", type: "topic" },
    { name: "Security", type: "topic" }
  ];

  const entityRecords = await Promise.all(
    entities.map((e) => prisma.entity.create({ data: e }))
  );

  const baseArticles = [
    // 🇵🇹 Portugal articles
    {
      country: "PT",
      source: "Publico.pt",
      title: "Portugal debates new climate policy",
      url: "https://publico.pt/climate-policy",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
      rawText: "Portugal announces new climate legislation...",
      topics: ["climate"],
      sentiment: 0.22,
      entities: ["Environment"]
    },
    {
      country: "PT",
      source: "Observador.pt",
      title: "Economic growth slows down",
      url: "https://observador.pt/economy-slowdown",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      rawText: "The national bank reports slower GDP growth...",
      topics: ["economy"],
      sentiment: -0.12,
      entities: ["Economy"]
    },
    {
      country: "PT",
      source: "JN.pt",
      title: "Crime rates fall in major cities",
      url: "https://jn.pt/security-report",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      rawText: "New police data shows declining crime levels...",
      topics: ["safety"],
      sentiment: 0.35,
      entities: ["Security"]
    },
    {
      country: "PT",
      source: "Expresso.pt",
      title: "Government announces tax reform",
      url: "https://expresso.pt/tax-reform",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
      rawText: "The government introduced changes to the tax system...",
      topics: ["policy"],
      sentiment: 0.10,
      entities: ["Government", "Economy"]
    },

    // 🇸🇪 Sweden articles
    {
      country: "SE",
      source: "SVT.se",
      title: "Sweden strengthens environmental protections",
      url: "https://svt.se/environment-protections",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
      rawText: "New measures aim to reduce emissions...",
      topics: ["climate"],
      sentiment: 0.41,
      entities: ["Environment"]
    },
    {
      country: "SE",
      source: "Aftonbladet.se",
      title: "Economic uncertainty rises",
      url: "https://aftonbladet.se/economic-uncertainty",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      rawText: "Analysts warn of slower growth...",
      topics: ["economy"],
      sentiment: -0.18,
      entities: ["Economy"]
    },
    {
      country: "SE",
      source: "DN.se",
      title: "Debate intensifies around security policies",
      url: "https://dn.se/security-policy",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      rawText: "Lawmakers argue over new proposals...",
      topics: ["policy", "safety"],
      sentiment: -0.05,
      entities: ["Government", "Security"]
    },
    {
      country: "SE",
      source: "SVT.se",
      title: "Government reviews carbon tax structure",
      url: "https://svt.se/carbon-tax-review",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
      rawText: "Carbon tax changes under consideration...",
      topics: ["climate", "policy"],
      sentiment: 0.15,
      entities: ["Environment", "Government"]
    }
  ];

  for (const article of baseArticles) {
    const a = await prisma.article.create({
      data: {
        source: article.source,
        title: article.title,
        url: article.url,
        publishedAt: article.publishedAt,
        rawText: article.rawText,
        country: article.country
      }
    });

    const analysis = await prisma.analysis.create({
      data: {
        articleId: a.id,
        sentiment: article.sentiment,
        topics: article.topics,
        entities: article.entities
      }
    });

    // Link entity occurrences
    for (const entName of article.entities) {
      const ent = entityRecords.find((e) => e.name === entName);
      if (!ent) continue;

      await prisma.entityOccurrence.create({
        data: {
          entityId: ent.id,
          analysisId: analysis.id,
          count: 1
        }
      });
    }
  }

  console.log("🌱 Mock data inserted successfully.");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
