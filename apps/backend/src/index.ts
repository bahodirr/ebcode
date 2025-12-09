import { Hono } from 'hono'
import { cors } from 'hono/cors'
import projects from './routes/projects'
import agent from './routes/agent'

const app = new Hono()

app.use(
  '/*',
  cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    credentials: true,
  })
)

app.get('/health', (c) => c.text('ok'))

app.route('/api/projects', projects)
app.route('/api/agent', agent)

export default app
