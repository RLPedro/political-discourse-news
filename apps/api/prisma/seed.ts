import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const main = async () => {
  const articles = [
    { source: 'Example News', title: 'Climate policy gains momentum', url: 'https://example.com/a1', publishedAt: new Date('2025-10-10'), author: 'A. Smith' },
    { source: 'Global Times', title: 'Economy and climate talks stall', url: 'https://example.com/a2', publishedAt: new Date('2025-10-11'), author: 'B. Jones' },
    { source: 'Daily Ledger', title: 'New bill proposes green subsidies', url: 'https://example.com/a3', publishedAt: new Date('2025-10-12'), author: 'C. Lee' },
    { source: 'Daily Ledger', title: 'Opposition questions policy cost', url: 'https://example.com/a4', publishedAt: new Date('2025-10-13'), author: 'C. Lee' }
  ];

  for (const a of articles) {
    const article = await prisma.article.upsert({
      where: { url: a.url },
      create: a,
      update: a,
    });

    const sentiment =
      a.title.toLowerCase().includes('climate') || a.title.toLowerCase().includes('green')
        ? 0.6
        : 0.3;
    await prisma.analysis.create({
      data: {
        articleId: article.id,
        sentiment,
        topics: ['policy', 'climate'],
        entities: { terms: ['climate', 'policy'] }
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Seeded dev data.');
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
