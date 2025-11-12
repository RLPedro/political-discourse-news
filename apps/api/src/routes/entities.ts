import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const router = Router()

router.get('/', async (req, res) => {
  const term = (req.query.term as string | undefined)?.toLowerCase() ?? ''
  const limit = Number(req.query.limit ?? 10)

  const analyses = await prisma.analysis.findMany({
    where: term ? { Article: { title: { contains: term, mode: 'insensitive' } } } : {},
    select: { id: true },
  })
  const analysisIds = analyses.map(a => a.id)
  if (analysisIds.length === 0) return res.json({ term, items: [] })

  const items = await prisma.$queryRawUnsafe<any[]>(`
    SELECT e.name, e.type, COUNT(*) as occurrences
    FROM "EntityOccurrence" eo
    JOIN "Entity" e ON e.id = eo."entityId"
    WHERE eo."analysisId" = ANY($1)
    GROUP BY e.name, e.type
    ORDER BY occurrences DESC
    LIMIT $2
  `, analysisIds, limit)

  res.json({ term, items })
})

export default router
