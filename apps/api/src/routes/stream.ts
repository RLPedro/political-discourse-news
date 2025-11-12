import { Router } from 'express'
import { bus } from '../events/bus.js'

const router = Router()

router.get('/ingestion', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()

  const onEvent = (evt: any) => {
    res.write(`event: ${evt.type}\n`)
    res.write(`data: ${JSON.stringify(evt.payload)}\n\n`)
  }

  bus.on('event', onEvent)

  req.on('close', () => {
    bus.off('event', onEvent)
    res.end()
  })
})

export default router
