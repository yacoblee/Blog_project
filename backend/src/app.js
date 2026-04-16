require('dotenv').config()

const express       = require('express')
const cors          = require('cors')
const helmet        = require('helmet')
const cookieParser  = require('cookie-parser')
const errorHandler  = require('./middleware/errorHandler')

const authRouter       = require('./routes/auth')
const postsRouter      = require('./routes/posts')
const categoriesRouter = require('./routes/categories')
const guestbookRouter  = require('./routes/guestbook')

const app  = express()
const PORT = process.env.PORT || 4000

// ── 허용 오리진 (MSA 환경에서는 여러 도메인 허용 가능) ──────────
const ALLOWED_ORIGINS = process.env.NODE_ENV === 'production'
  ? (process.env.FRONTEND_ORIGINS || '').split(',').map(s => s.trim())
  : ['http://localhost:5173']

// ── 기본 미들웨어 ───────────────────────────────────────────────
app.use(helmet())

app.use(cors({
  origin: (origin, cb) => {
    // 동일 서버 요청(origin 없음) 또는 허용 목록에 있으면 통과
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true)
    cb(new Error(`CORS 차단: ${origin}`))
  },
  credentials: true,               // 쿠키 전송 허용 (필수)
  exposedHeaders: ['X-CSRF-Token'], // CSRF 토큰 헤더 노출
}))

app.use(cookieParser())
app.use(express.json())

// ── 라우터 ────────────────────────────────────────────────────
app.use('/api/auth',       authRouter)
app.use('/api/posts',      postsRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/guestbook',  guestbookRouter)

// ── 헬스 체크 ─────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: '요청한 경로를 찾을 수 없습니다.' })
})

// ── 에러 핸들러 ───────────────────────────────────────────────
app.use(errorHandler)

// ── 서버 시작 ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
  console.log(`   NODE_ENV : ${process.env.NODE_ENV || 'development'}`)
  console.log(`   CORS     : ${ALLOWED_ORIGINS.join(', ')}`)
})
