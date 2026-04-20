/**
 * JWT 인증 흐름 + API 통신 흐름을 PDF로 생성하는 스크립트
 *
 * 실행: node scripts/generate-jwt-pdf.js
 * 출력: C:\Users\ss\Documents\MainProject\JWT_Auth_Flow.pdf
 */
const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

const OUTPUT = path.join(__dirname, '..', 'JWT_Auth_Flow.pdf')
const FONT = 'C:\\Windows\\Fonts\\malgun.ttf'
const FONT_BOLD = 'C:\\Windows\\Fonts\\malgunbd.ttf'

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  info: {
    Title: 'Blog Project — JWT 인증 흐름 및 API 통신 가이드',
    Author: '안성훈',
  },
})

const stream = fs.createWriteStream(OUTPUT)
doc.pipe(stream)

// ── 색상 팔레트 ────────────────────────────────────────────
const C = {
  primary:   '#6C3AED',  // 보라 (accent)
  secondary: '#2563EB',  // 파랑
  success:   '#059669',  // 초록
  danger:    '#DC2626',  // 빨강
  orange:    '#D97706',
  bg:        '#F8F7FF',
  codeBg:    '#1E1E2E',
  codeText:  '#CDD6F4',
  textDark:  '#1F2937',
  textMid:   '#4B5563',
  textLight: '#9CA3AF',
  border:    '#E5E7EB',
  white:     '#FFFFFF',
  lightBg:   '#F3F4F6',
}

// ── 유틸 ───────────────────────────────────────────────────
const PW = 595.28 // A4 width
const PH = 841.89 // A4 height
const ML = 50, MR = 50, MT = 50, MB = 50
const CW = PW - ML - MR  // content width

function registerFonts() {
  doc.registerFont('Korean', FONT)
  doc.registerFont('KoreanBold', FONT_BOLD)
}

function ensureSpace(needed) {
  if (doc.y + needed > PH - MB) {
    doc.addPage()
  }
}

// ── 드로잉 헬퍼 ────────────────────────────────────────────
function drawTitle(text) {
  ensureSpace(60)
  doc.font('KoreanBold').fontSize(22).fillColor(C.primary)
  doc.text(text, ML, doc.y, { width: CW })
  doc.moveDown(0.3)
  // 밑줄
  doc.moveTo(ML, doc.y).lineTo(ML + CW, doc.y)
    .strokeColor(C.primary).lineWidth(2).stroke()
  doc.moveDown(0.8)
}

function drawSubtitle(text) {
  ensureSpace(40)
  doc.font('KoreanBold').fontSize(15).fillColor(C.secondary)
  doc.text(text, ML, doc.y, { width: CW })
  doc.moveDown(0.5)
}

function drawSubSubtitle(text) {
  ensureSpace(30)
  doc.font('KoreanBold').fontSize(12).fillColor(C.textDark)
  doc.text(text, ML, doc.y, { width: CW })
  doc.moveDown(0.3)
}

function drawParagraph(text) {
  ensureSpace(20)
  doc.font('Korean').fontSize(10).fillColor(C.textDark)
  doc.text(text, ML, doc.y, { width: CW, lineGap: 4 })
  doc.moveDown(0.5)
}

function drawBullet(text, indent = 0) {
  ensureSpace(18)
  const x = ML + 10 + indent
  doc.font('Korean').fontSize(10).fillColor(C.textDark)
  doc.text('\u2022  ' + text, x, doc.y, { width: CW - 10 - indent, lineGap: 3 })
  doc.moveDown(0.15)
}

function drawCodeBlock(lines, title) {
  const lineH = 13
  const totalH = lines.length * lineH + 24
  ensureSpace(totalH + 30)

  const startY = doc.y

  if (title) {
    doc.roundedRect(ML, startY, CW, 22, 4)
      .fill('#2D2D3F')
    doc.font('Korean').fontSize(8).fillColor('#A5B4FC')
    doc.text(title, ML + 10, startY + 6, { width: CW - 20 })
  }

  const codeY = title ? startY + 22 : startY
  doc.roundedRect(ML, codeY, CW, totalH - (title ? 22 : 0), title ? 0 : 4)
    .fill(C.codeBg)

  doc.font('Courier').fontSize(8.5).fillColor(C.codeText)
  let y = codeY + 10
  for (const line of lines) {
    if (y > PH - MB - 20) break
    doc.text(line, ML + 12, y, { width: CW - 24 })
    y += lineH
  }

  doc.y = codeY + totalH - (title ? 22 : 0) + 8
  doc.moveDown(0.3)
}

// ── 플로우차트 박스 + 화살표 ────────────────────────────────
function drawFlowBox(x, y, w, h, text, color, subtext) {
  doc.roundedRect(x, y, w, h, 6).fill(color)
  doc.font('KoreanBold').fontSize(9).fillColor(C.white)
  const textY = subtext ? y + h / 2 - 12 : y + h / 2 - 5
  doc.text(text, x, textY, { width: w, align: 'center' })
  if (subtext) {
    doc.font('Korean').fontSize(7).fillColor('#E0E0E0')
    doc.text(subtext, x, textY + 14, { width: w, align: 'center' })
  }
}

function drawArrow(x1, y1, x2, y2, label, color) {
  color = color || C.textMid
  doc.moveTo(x1, y1).lineTo(x2, y2)
    .strokeColor(color).lineWidth(1.2).stroke()
  // 화살표 머리
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const headLen = 6
  doc.moveTo(x2, y2)
    .lineTo(x2 - headLen * Math.cos(angle - 0.4), y2 - headLen * Math.sin(angle - 0.4))
    .lineTo(x2 - headLen * Math.cos(angle + 0.4), y2 - headLen * Math.sin(angle + 0.4))
    .fill(color)
  if (label) {
    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2 - 8
    doc.font('Korean').fontSize(7).fillColor(color)
    doc.text(label, mx - 60, my, { width: 120, align: 'center' })
  }
}

function drawDashedArrow(x1, y1, x2, y2, label, color) {
  color = color || C.textLight
  doc.moveTo(x1, y1).lineTo(x2, y2)
    .strokeColor(color).lineWidth(1).dash(4, { space: 3 }).stroke()
  doc.undash()
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const headLen = 5
  doc.moveTo(x2, y2)
    .lineTo(x2 - headLen * Math.cos(angle - 0.4), y2 - headLen * Math.sin(angle - 0.4))
    .lineTo(x2 - headLen * Math.cos(angle + 0.4), y2 - headLen * Math.sin(angle + 0.4))
    .fill(color)
  if (label) {
    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2 - 8
    doc.font('Korean').fontSize(7).fillColor(color)
    doc.text(label, mx - 60, my, { width: 120, align: 'center' })
  }
}


// ── 테이블 ─────────────────────────────────────────────────
function drawTable(headers, rows, colWidths) {
  const rowH = 22
  const totalH = (rows.length + 1) * rowH + 4
  ensureSpace(totalH)

  let y = doc.y
  let x = ML

  // header
  for (let i = 0; i < headers.length; i++) {
    doc.rect(x, y, colWidths[i], rowH).fill(C.primary)
    doc.font('KoreanBold').fontSize(8.5).fillColor(C.white)
    doc.text(headers[i], x + 6, y + 6, { width: colWidths[i] - 12, align: 'left' })
    x += colWidths[i]
  }
  y += rowH

  // rows
  for (const row of rows) {
    x = ML
    const bg = (rows.indexOf(row) % 2 === 0) ? C.lightBg : C.white
    for (let i = 0; i < row.length; i++) {
      doc.rect(x, y, colWidths[i], rowH).fill(bg)
      doc.rect(x, y, colWidths[i], rowH).strokeColor(C.border).lineWidth(0.5).stroke()
      doc.font('Korean').fontSize(8).fillColor(C.textDark)
      doc.text(row[i], x + 6, y + 6, { width: colWidths[i] - 12, align: 'left' })
      x += colWidths[i]
    }
    y += rowH
  }
  doc.y = y + 8
}


// ════════════════════════════════════════════════════════════
// 문서 본문 시작
// ════════════════════════════════════════════════════════════
registerFonts()

// ── 표지 ──────────────────────────────────────────────────
doc.rect(0, 0, PW, PH).fill('#1A1A2E')

// 장식 원
doc.circle(PW - 80, 120, 140).fill('rgba(108, 58, 237, 0.15)')
doc.circle(80, PH - 120, 100).fill('rgba(37, 99, 235, 0.1)')

doc.font('KoreanBold').fontSize(32).fillColor(C.white)
doc.text('Blog Project', ML + 30, 240, { width: CW - 60, align: 'center' })

doc.font('KoreanBold').fontSize(18).fillColor('#A78BFA')
doc.text('JWT \uC778\uC99D \uD750\uB984 \uBC0F API \uD1B5\uC2E0 \uAC00\uC774\uB4DC', ML + 30, 300, { width: CW - 60, align: 'center' })

doc.moveDown(2)
doc.font('Korean').fontSize(11).fillColor('#9CA3AF')
doc.text('React 19  +  Express  +  PostgreSQL  +  Tiptap', ML + 30, 370, { width: CW - 60, align: 'center' })

doc.font('Korean').fontSize(10).fillColor('#6B7280')
doc.text('\uC791\uC131\uC790: \uC548\uC131\uD6C8', ML + 30, PH - 140, { width: CW - 60, align: 'center' })
doc.text('2026.04', ML + 30, PH - 120, { width: CW - 60, align: 'center' })

// ════════════════════════════════════════════════════════════
// 목차
// ════════════════════════════════════════════════════════════
doc.addPage()
drawTitle('\uBAA9\uCC28')

const toc = [
  ['1.', '\uC804\uCCB4 \uC544\uD0A4\uD14D\uCC98 \uAC1C\uC694'],
  ['2.', 'JWT \uC778\uC99D \uD750\uB984 \u2014 \uC804\uCCB4 \uCC28\uD2B8'],
  ['3.', '\uB85C\uADF8\uC778 \uD504\uB85C\uC138\uC2A4 (Login Flow)'],
  ['4.', '\uC138\uC158 \uBCF5\uC6D0 \uD504\uB85C\uC138\uC2A4 (App Mount)'],
  ['5.', 'Access Token \uC790\uB3D9 \uAC31\uC2E0 (Silent Refresh)'],
  ['6.', 'API \uD1B5\uC2E0 \uD750\uB984 \u2014 Posts CRUD'],
  ['7.', '\uBCF4\uC548 \uC804\uB7B5 \uC694\uC57D'],
  ['8.', '\uC5D4\uB4DC\uD3EC\uC778\uD2B8 \uB808\uD37C\uB7F0\uC2A4'],
]

for (const [num, label] of toc) {
  doc.font('KoreanBold').fontSize(12).fillColor(C.primary)
  doc.text(num, ML + 10, doc.y, { continued: true, width: 30 })
  doc.font('Korean').fontSize(12).fillColor(C.textDark)
  doc.text('  ' + label, { width: CW - 40 })
  doc.moveDown(0.4)
}

// ════════════════════════════════════════════════════════════
// 1. 전체 아키텍처 개요
// ════════════════════════════════════════════════════════════
doc.addPage()
drawTitle('1. \uC804\uCCB4 \uC544\uD0A4\uD14D\uCC98 \uAC1C\uC694')

drawParagraph('\uBCF8 \uD504\uB85C\uC81D\uD2B8\uB294 Access Token(15\uBD84, \uBA54\uBAA8\uB9AC) + Refresh Token(7\uC77C, HttpOnly \uCFE0\uD0A4) \uC774\uC911 \uD1A0\uD070 \uD328\uD134\uC744 \uC0AC\uC6A9\uD569\uB2C8\uB2E4.')
drawParagraph('Access Token\uC740 \uBE0C\uB77C\uC6B0\uC800 \uBA54\uBAA8\uB9AC(Redux store)\uC5D0\uB9CC \uC800\uC7A5\uB418\uC5B4 XSS\uB85C \uD0C8\uCDE8 \uBD88\uAC00\uB2A5\uD558\uACE0, Refresh Token\uC740 HttpOnly \uCFE0\uD0A4\uB85C JavaScript\uC5D0\uC11C \uC811\uADFC \uC790\uCCB4\uAC00 \uBD88\uAC00\uB2A5\uD569\uB2C8\uB2E4.')

// 아키텍처 다이어그램
ensureSpace(200)
const diagramY = doc.y + 10

// Browser 영역
doc.roundedRect(ML, diagramY, 210, 170, 8).fillAndStroke('#EDE9FE', C.primary)
doc.font('KoreanBold').fontSize(10).fillColor(C.primary)
doc.text('Browser (Frontend)', ML + 10, diagramY + 8)

drawFlowBox(ML + 15, diagramY + 35, 85, 30, 'React App', '#7C3AED', 'UI Components')
drawFlowBox(ML + 110, diagramY + 35, 85, 30, 'Redux Store', '#6D28D9', 'accessToken')
drawFlowBox(ML + 15, diagramY + 80, 85, 30, 'fetchWithAuth', '#5B21B6', 'Interceptor')
drawFlowBox(ML + 110, diagramY + 80, 85, 30, 'React Query', '#4C1D95', 'Cache / Hook')
drawFlowBox(ML + 60, diagramY + 125, 100, 30, 'HttpOnly Cookie', '#DC2626', 'Refresh Token')

// Server 영역
doc.roundedRect(ML + 280, diagramY, 210, 170, 8).fillAndStroke('#EFF6FF', C.secondary)
doc.font('KoreanBold').fontSize(10).fillColor(C.secondary)
doc.text('Server (Backend)', ML + 290, diagramY + 8)

drawFlowBox(ML + 295, diagramY + 35, 85, 30, 'Express', '#2563EB', 'REST API')
drawFlowBox(ML + 390, diagramY + 35, 85, 30, 'JWT Auth', '#1D4ED8', 'Middleware')
drawFlowBox(ML + 295, diagramY + 80, 85, 30, 'Routes', '#1E40AF', '/api/auth, posts')
drawFlowBox(ML + 390, diagramY + 80, 85, 30, 'PostgreSQL', '#059669', 'JSONB')
drawFlowBox(ML + 340, diagramY + 125, 100, 30, 'Cookie Opts', '#DC2626', 'httpOnly: true')

// 화살표
drawArrow(ML + 210, diagramY + 95, ML + 280, diagramY + 95, 'Bearer <accessToken>', C.primary)
drawDashedArrow(ML + 160, diagramY + 155, ML + 340, diagramY + 155, 'Set-Cookie: refreshToken', C.danger)

doc.y = diagramY + 190

drawParagraph('\u2022 \uBE0C\uB77C\uC6B0\uC800 \u2192 \uC11C\uBC84: Authorization: Bearer <accessToken> \uD5E4\uB354\uB85C \uC804\uC1A1')
drawParagraph('\u2022 \uC11C\uBC84 \u2192 \uBE0C\uB77C\uC6B0\uC800: Set-Cookie (HttpOnly, Secure, SameSite) \uB85C Refresh Token \uC804\uB2EC')

// ════════════════════════════════════════════════════════════
// 2. JWT 인증 흐름 — 전체 차트
// ════════════════════════════════════════════════════════════
doc.addPage()
drawTitle('2. JWT \uC778\uC99D \uD750\uB984 \u2014 \uC804\uCCB4 \uCC28\uD2B8')

ensureSpace(480)
const chartY = doc.y

// 컬럼 레이블
const colBrowser = ML + 60
const colFront   = ML + 180
const colBack    = ML + 310
const colDB      = ML + 430

doc.font('KoreanBold').fontSize(9)
doc.fillColor(C.primary).text('Browser', colBrowser - 25, chartY, { width: 80, align: 'center' })
doc.fillColor('#6D28D9').text('Frontend', colFront - 25, chartY, { width: 80, align: 'center' })
doc.fillColor(C.secondary).text('Backend', colBack - 25, chartY, { width: 80, align: 'center' })
doc.fillColor(C.success).text('PostgreSQL', colDB - 25, chartY, { width: 80, align: 'center' })

// 수직선
const lineTop = chartY + 18
const lineBot = chartY + 440
doc.moveTo(colBrowser, lineTop).lineTo(colBrowser, lineBot).strokeColor(C.primary).lineWidth(1).dash(3, { space: 4 }).stroke().undash()
doc.moveTo(colFront, lineTop).lineTo(colFront, lineBot).strokeColor('#6D28D9').lineWidth(1).dash(3, { space: 4 }).stroke().undash()
doc.moveTo(colBack, lineTop).lineTo(colBack, lineBot).strokeColor(C.secondary).lineWidth(1).dash(3, { space: 4 }).stroke().undash()
doc.moveTo(colDB, lineTop).lineTo(colDB, lineBot).strokeColor(C.success).lineWidth(1).dash(3, { space: 4 }).stroke().undash()

// 시퀀스
let sy = lineTop + 20
function seqArrow(x1, x2, label, color) {
  drawArrow(x1, sy, x2, sy, '', color || C.textMid)
  doc.font('Korean').fontSize(7).fillColor(color || C.textMid)
  const mx = Math.min(x1, x2) + 5
  doc.text(label, mx, sy - 12, { width: Math.abs(x2 - x1) - 10, align: 'center' })
  sy += 35
}

function seqLabel(x, text, color) {
  doc.font('KoreanBold').fontSize(7.5).fillColor(color || C.orange)
  doc.text(text, x - 60, sy - 6, { width: 120, align: 'center' })
  sy += 12
}

// Login Flow
seqLabel(colBrowser, '[ Login Flow ]', C.primary)
seqArrow(colBrowser, colFront, 'email + password \uC785\uB825', C.primary)
seqArrow(colFront, colBack, 'POST /api/auth/login', C.secondary)
seqArrow(colBack, colDB, 'SELECT * FROM admins', C.success)
seqArrow(colDB, colBack, 'admin row \uBC18\uD658', C.success)
seqArrow(colBack, colFront, 'accessToken (body)\n+ Set-Cookie: refreshToken', C.danger)
seqArrow(colFront, colBrowser, 'Redux store.dispatch(loginSuccess)', '#6D28D9')

// API Call
seqLabel(colBrowser, '[ API Call (posts CRUD) ]', C.secondary)
seqArrow(colFront, colBack, 'Bearer <accessToken>\nPOST /api/posts', C.secondary)
seqArrow(colBack, colDB, 'INSERT INTO posts (JSONB)', C.success)
seqArrow(colDB, colBack, 'RETURNING *', C.success)
seqArrow(colBack, colFront, 'JSON Response { data: post }', C.secondary)

doc.y = chartY + 460


// ════════════════════════════════════════════════════════════
// 3. 로그인 프로세스
// ════════════════════════════════════════════════════════════
doc.addPage()
drawTitle('3. \uB85C\uADF8\uC778 \uD504\uB85C\uC138\uC2A4 (Login Flow)')

drawSubtitle('3-1. \uD504\uB860\uD2B8\uC5D4\uB4DC \u2014 LoginModal.jsx')
drawParagraph('\uC0AC\uC6A9\uC790\uAC00 \uC0AC\uC774\uB4DC\uBC14 \"\uAD00\uB9AC\uC790 \uB85C\uADF8\uC778\" \uBC84\uD2BC \uD074\uB9AD \u2192 LoginModal \uB80C\uB354 \u2192 \uC774\uBA54\uC77C/\uBE44\uBC00\uBC88\uD638 \uC81C\uCD9C')

drawCodeBlock([
  '// LoginModal.jsx \u2014 handleSubmit',
  'const handleSubmit = async (e) => {',
  '  e.preventDefault()',
  '  const res = await loginAdmin({ email, password })',
  '',
  '  // accessToken \u2192 Redux \uBA54\uBAA8\uB9AC \uC800\uC7A5 (localStorage \uC0AC\uC6A9 \uC548 \uD568)',
  '  dispatch(loginSuccess({ accessToken: res.data.accessToken }))',
  '  onClose()',
  '}',
], 'frontend/src/components/common/LoginModal.jsx')

drawSubtitle('3-2. \uD504\uB860\uD2B8\uC5D4\uB4DC \u2014 auth.js (API \uD568\uC218)')

drawCodeBlock([
  '// auth.js \u2014 loginAdmin',
  'export async function loginAdmin({ email, password }) {',
  '  const res = await fetch(\'/api/auth/login\', {',
  '    method:      \'POST\',',
  '    credentials: \'include\',        // \uCFE0\uD0A4 \uC218\uC2E0 \uD5C8\uC6A9',
  '    headers:     { \'Content-Type\': \'application/json\' },',
  '    body:        JSON.stringify({ email, password }),',
  '  })',
  '  const data = await res.json()',
  '  if (!res.ok) throw new Error(data.error)',
  '  return data // { data: { accessToken, expiresIn, admin } }',
  '}',
], 'frontend/src/api/auth.js')

drawSubtitle('3-3. \uBC31\uC5D4\uB4DC \u2014 routes/auth.js (Login)')

drawCodeBlock([
  '// POST /api/auth/login',
  'router.post(\'/login\', async (req, res) => {',
  '  const { email, password } = req.body',
  '  const { rows } = await pool.query(',
  '    \'SELECT * FROM admins WHERE email = $1\', [email]',
  '  )',
  '  const admin = rows[0]',
  '  const match = await bcrypt.compare(password, admin.password_hash)',
  '',
  '  const accessToken  = jwt.sign(          // 15\uBD84 \uC720\uD6A8',
  '    { id: admin.id, email: admin.email, role: \'admin\' },',
  '    process.env.JWT_SECRET, { expiresIn: \'15m\' }',
  '  )',
  '  const refreshToken = jwt.sign(          // 7\uC77C \uC720\uD6A8',
  '    { id: admin.id, role: \'admin\' },',
  '    process.env.JWT_REFRESH_SECRET, { expiresIn: \'7d\' }',
  '  )',
  '',
  '  // Refresh Token \u2192 HttpOnly \uCFE0\uD0A4 (JS \uC811\uADFC \uBD88\uAC00)',
  '  res.cookie(\'refreshToken\', refreshToken, {',
  '    httpOnly: true,  secure: isProd,',
  '    sameSite: isProd ? \'strict\' : \'lax\',',
  '    path: \'/api/auth\',  maxAge: 7 * 24 * 60 * 60 * 1000',
  '  })',
  '',
  '  // Access Token \u2192 \uC751\uB2F5 \uBC14\uB514 (\uBA54\uBAA8\uB9AC\uC5D0\uB9CC \uC800\uC7A5)',
  '  res.json({ data: { accessToken, expiresIn: 900, admin } })',
  '})',
], 'backend/src/routes/auth.js')


// ════════════════════════════════════════════════════════════
// 4. 세션 복원
// ════════════════════════════════════════════════════════════
doc.addPage()
drawTitle('4. \uC138\uC158 \uBCF5\uC6D0 \uD504\uB85C\uC138\uC2A4 (App Mount)')

drawParagraph('\uBE0C\uB77C\uC6B0\uC800 \uC0C8\uB85C\uACE0\uCE68 \uC2DC Access Token\uC740 \uBA54\uBAA8\uB9AC\uC5D0\uC11C \uC0AC\uB77C\uC9C0\uC9C0\uB9CC, HttpOnly \uCFE0\uD0A4\uC758 Refresh Token\uC740 \uC0B4\uC544 \uC788\uC2B5\uB2C8\uB2E4. App \uCEF4\uD3EC\uB10C\uD2B8 \uB9C8\uC6B4\uD2B8 \uC2DC AuthInit \uCEF4\uD3EC\uB10C\uD2B8\uAC00 /api/auth/me \uB97C \uD638\uCD9C\uD558\uC5EC \uC138\uC158\uC744 \uBCF5\uC6D0\uD569\uB2C8\uB2E4.')

// 세션 복원 플로우차트
ensureSpace(120)
const srY = doc.y + 5
drawFlowBox(ML, srY, 95, 32, 'App Mount', C.primary, 'AuthInit')
drawArrow(ML + 95, srY + 16, ML + 115, srY + 16)
drawFlowBox(ML + 115, srY, 110, 32, '/api/auth/me', C.secondary, 'Refresh Cookie \uC804\uC1A1')
drawArrow(ML + 225, srY + 16, ML + 245, srY + 16)
drawFlowBox(ML + 245, srY, 110, 32, 'JWT Verify', C.success, 'Refresh Token \uAC80\uC99D')
drawArrow(ML + 355, srY + 16, ML + 375, srY + 16)
drawFlowBox(ML + 375, srY, 110, 32, 'loginSuccess', '#6D28D9', '\uC0C8 accessToken \uBC1C\uAE09')
doc.y = srY + 50

drawCodeBlock([
  '// App.jsx \u2014 AuthInit (App \uCD5C\uCD08 \uB9C8\uC6B4\uD2B8 \uC2DC 1\uD68C \uC2E4\uD589)',
  'function AuthInit() {',
  '  const dispatch = useDispatch()',
  '  const initialized = useSelector(state => state.auth.initialized)',
  '',
  '  useEffect(() => {',
  '    if (initialized) return',
  '    checkAuthSession()          // GET /api/auth/me (Cookie \uC790\uB3D9 \uC804\uC1A1)',
  '      .then(data => {',
  '        if (data?.data?.accessToken) {',
  '          dispatch(loginSuccess({ accessToken: data.data.accessToken }))',
  '        } else {',
  '          dispatch(authChecked()) // \uBBF8\uC778\uC99D \uC0C1\uD0DC\uB85C \uCD08\uAE30\uD654',
  '        }',
  '      })',
  '      .catch(() => dispatch(authChecked()))',
  '  }, [dispatch, initialized])',
  '  return null',
  '}',
], 'frontend/src/App.jsx')

drawCodeBlock([
  '// GET /api/auth/me  (\uBC31\uC5D4\uB4DC)',
  'router.get(\'/me\', async (req, res) => {',
  '  const token = req.cookies.refreshToken    // HttpOnly \uCFE0\uD0A4\uC5D0\uC11C \uCD94\uCD9C',
  '  if (!token) return res.status(401).json({ ... })',
  '',
  '  const payload = jwt.verify(token, JWT_REFRESH_SECRET)',
  '  const { rows } = await pool.query(',
  '    \'SELECT id, email FROM admins WHERE id = $1\', [payload.id]',
  '  )',
  '',
  '  // \uC0C8 Access Token\uB3C4 \uD568\uAED8 \uBC1C\uAE09',
  '  const accessToken = createAccessToken(rows[0])',
  '  res.json({ data: { admin: rows[0], accessToken, expiresIn: 900 } })',
  '})',
], 'backend/src/routes/auth.js')


// ════════════════════════════════════════════════════════════
// 5. Access Token 자동 갱신
// ════════════════════════════════════════════════════════════
doc.addPage()
drawTitle('5. Access Token \uC790\uB3D9 \uAC31\uC2E0 (Silent Refresh)')

drawParagraph('fetchWithAuth\uB294 \uBAA8\uB4E0 \uC778\uC99D \uD544\uC694 API \uC694\uCCAD\uC758 \uB798\uD37C\uC785\uB2C8\uB2E4. 401 \uC751\uB2F5\uC744 \uBC1B\uC73C\uBA74 \uC790\uB3D9\uC73C\uB85C Refresh Token\uC73C\uB85C \uC0C8 Access Token\uC744 \uBC1C\uAE09\uBC1B\uACE0 \uC6D0\uB798 \uC694\uCCAD\uC744 \uC7AC\uC2DC\uB3C4\uD569\uB2C8\uB2E4.')

// Silent Refresh 플로우
ensureSpace(160)
const rfY = doc.y + 5

drawFlowBox(ML, rfY, 90, 45, 'fetchWithAuth', C.primary, 'Bearer Token\uBD80\uCC29')
drawArrow(ML + 90, rfY + 22, ML + 110, rfY + 22, '', C.secondary)
drawFlowBox(ML + 110, rfY, 80, 45, 'API \uC694\uCCAD', C.secondary, 'POST/PUT/DEL')
drawArrow(ML + 190, rfY + 22, ML + 210, rfY + 22, '', C.danger)
drawFlowBox(ML + 210, rfY, 65, 45, '401', C.danger, '\uD1A0\uD070\uB9CC\uB8CC')

drawArrow(ML + 242, rfY + 45, ML + 242, rfY + 70, '', C.orange)
drawFlowBox(ML + 200, rfY + 70, 85, 45, '/auth/refresh', C.orange, 'Cookie \uC804\uC1A1')
drawArrow(ML + 285, rfY + 92, ML + 320, rfY + 92, '', C.success)
drawFlowBox(ML + 320, rfY + 70, 85, 45, '\uC0C8 Token', C.success, 'store \uC5C5\uB370\uC774\uD2B8')
drawArrow(ML + 405, rfY + 92, ML + 425, rfY + 92, '', C.primary)
drawFlowBox(ML + 425, rfY + 70, 65, 45, '\uC7AC\uC2DC\uB3C4', C.primary, '\uC6D0\uB798 \uC694\uCCAD')

doc.y = rfY + 130

drawCodeBlock([
  '// fetchWithAuth.js \u2014 \uD575\uC2EC \uB85C\uC9C1',
  'export async function fetchWithAuth(url, options = {}) {',
  '  const token = store.getState().auth.accessToken',
  '  const mergedOptions = {',
  '    ...options,',
  '    credentials: \'include\',           // Refresh Token \uCFE0\uD0A4 \uC804\uC1A1',
  '    headers: {',
  '      \'Content-Type\': \'application/json\',',
  '      ...options.headers,',
  '      ...(token ? { Authorization: `Bearer ${token}` } : {}),',
  '    },',
  '  }',
  '',
  '  let res = await fetch(url, mergedOptions)',
  '',
  '  if (res.status === 401) {               // Access Token \uB9CC\uB8CC',
  '    // \uB3D9\uC2DC \uB2E4\uBC1C 401 \uC911\uBCF5 \uBC29\uC9C0 (Singleton Pattern)',
  '    if (!refreshPromise) {',
  '      refreshPromise = refreshAccessToken() // POST /api/auth/refresh',
  '        .finally(() => { refreshPromise = null })',
  '    }',
  '    const data = await refreshPromise',
  '',
  '    // \uC0C8 token \u2192 Redux store \uC5C5\uB370\uC774\uD2B8',
  '    store.dispatch(tokenRefreshed({',
  '      accessToken: data.data.accessToken',
  '    }))',
  '',
  '    // \uC6D0\uB798 \uC694\uCCAD 1\uD68C \uC7AC\uC2DC\uB3C4 (\uC0C8 \uD1A0\uD070\uC73C\uB85C)',
  '    const retryOptions = { ...mergedOptions,',
  '      headers: { ...mergedOptions.headers,',
  '        Authorization: `Bearer ${data.data.accessToken}` }',
  '    }',
  '    res = await fetch(url, retryOptions)',
  '  }',
  '  return res',
  '}',
], 'frontend/src/api/fetchWithAuth.js')

drawSubSubtitle('\uB3D9\uC2DC \uB2E4\uBC1C 401 \uCC98\uB9AC (Singleton Pattern)')
drawParagraph('\uC5EC\uB7EC API \uC694\uCCAD\uC774 \uB3D9\uC2DC\uC5D0 401\uC744 \uBC1B\uC73C\uBA74, refreshPromise \uC2F1\uAE00\uD1A4\uC73C\uB85C refresh \uC694\uCCAD\uC774 \uB531 1\uD68C\uB9CC \uC2E4\uD589\uB429\uB2C8\uB2E4. \uB098\uBA38\uC9C0\uB294 \uBAA8\uB450 \uAC19\uC740 Promise\uB97C await \uD558\uBBC0\uB85C \uC11C\uBC84\uC5D0 \uBD88\uD544\uC694\uD55C \uBD80\uD558\uB97C \uC8FC\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.')


// ════════════════════════════════════════════════════════════
// 6. API 통신 흐름 — Posts CRUD
// ════════════════════════════════════════════════════════════
doc.addPage()
drawTitle('6. API \uD1B5\uC2E0 \uD750\uB984 \u2014 Posts CRUD')

drawSubtitle('6-1. \uC5D4\uB4DC\uD3EC\uC778\uD2B8 \uC694\uC57D')

drawTable(
  ['\uBA54\uC11C\uB4DC', '\uACBD\uB85C', '\uC778\uC99D', '\uC6A9\uB3C4', 'fetch \uD568\uC218'],
  [
    ['GET', '/api/posts', '\u274C', '\uBAA9\uB85D (\uAC80\uC0C9/\uD398\uC774\uC9D5/\uCE74\uD14C\uACE0\uB9AC)', 'fetch()'],
    ['GET', '/api/posts/:id', '\u274C', '\uB2E8\uAC74 \uC870\uD68C', 'fetch()'],
    ['POST', '/api/posts', '\u2705', '\uAE00 \uC0DD\uC131 (Tiptap JSON)', 'fetchWithAuth()'],
    ['PUT', '/api/posts/:id', '\u2705', '\uAE00 \uC218\uC815 (Tiptap JSON)', 'fetchWithAuth()'],
    ['DELETE', '/api/posts/:id', '\u2705', '\uAE00 \uC0AD\uC81C', 'fetchWithAuth()'],
  ],
  [50, 110, 35, 155, 145]
)

drawSubtitle('6-2. \uD504\uB860\uD2B8\uC5D4\uB4DC \u2014 posts.js (React Query \uD6C5)')

drawCodeBlock([
  '// \uACF5\uAC1C API \u2014 \uC778\uC99D \uBD88\uD544\uC694 (\uC77C\uBC18 fetch)',
  'async function fetchPosts(params = {}) {',
  '  const query = new URLSearchParams(params).toString()',
  '  const res = await fetch(`/api/posts?${query}`,',
  '    { credentials: \'include\' })',
  '  return res.json()',
  '}',
  '',
  '// \uAD00\uB9AC\uC790 API \u2014 fetchWithAuth (\uC790\uB3D9 \uD1A0\uD070 \uAC31\uC2E0)',
  'async function createPost(data) {',
  '  const res = await fetchWithAuth(\'/api/posts\', {',
  '    method: \'POST\',',
  '    body: JSON.stringify(data)  // Tiptap JSON doc \uADF8\uB300\uB85C \uC804\uC1A1',
  '  })',
  '  return res.json()',
  '}',
  '',
  '// React Query Hook \u2014 \uCE90\uC2DC + \uC790\uB3D9 \uBB34\uD6A8\uD654',
  'export function useCreatePost() {',
  '  const qc = useQueryClient()',
  '  return useMutation({',
  '    mutationFn: createPost,',
  '    onSuccess: () => qc.invalidateQueries({ queryKey: [\'posts\'] }),',
  '  })',
  '}',
], 'frontend/src/api/posts.js')

drawSubtitle('6-3. \uBC31\uC5D4\uB4DC \u2014 routes/posts.js')

drawCodeBlock([
  '// POST /api/posts  \u2014 requireAuth \uBBF8\uB4E4\uC6E8\uC5B4 \uBCF4\uD638',
  'router.post(\'/\', requireAuth, async (req, res) => {',
  '  const { title, content, category, ... } = req.body',
  '',
  '  // content = Tiptap JSON \uAC1D\uCCB4 \u2192 pg \uB4DC\uB77C\uC774\uBC84\uAC00 JSONB\uB85C \uC790\uB3D9 \uC9C1\uB82C\uD654',
  '  const { rows } = await pool.query(',
  '    `INSERT INTO posts (title, content, category, ...)',
  '     VALUES ($1, $2, $3, ...) RETURNING *`,',
  '    [title, content, category, ...]',
  '  )',
  '  res.status(201).json({ data: rows[0] })',
  '})',
  '',
  '// requireAuth \uBBF8\uB4E4\uC6E8\uC5B4 \u2014 Bearer Token \uAC80\uC99D',
  'function requireAuth(req, res, next) {',
  '  const token = req.headers.authorization?.slice(7)',
  '  req.user = jwt.verify(token, JWT_SECRET)',
  '  next()',
  '  // 401 \u2192 { error, expired: true } \u2192 \uD504\uB860\uD2B8 \uC790\uB3D9 refresh',
  '}',
], 'backend/src/routes/posts.js + middleware/auth.js')


// ════════════════════════════════════════════════════════════
// 6-4. Tiptap JSON 데이터 흐름
// ════════════════════════════════════════════════════════════
doc.addPage()
drawSubtitle('6-4. Tiptap JSON \uB370\uC774\uD130 \uD750\uB984')

ensureSpace(110)
const tY = doc.y + 5
drawFlowBox(ML, tY, 105, 40, 'TiptapEditor', C.primary, 'editor.getJSON()')
drawArrow(ML + 105, tY + 20, ML + 125, tY + 20, '', C.secondary)
drawFlowBox(ML + 125, tY, 100, 40, 'fetch POST', C.secondary, 'JSON body')
drawArrow(ML + 225, tY + 20, ML + 245, tY + 20, '', C.success)
drawFlowBox(ML + 245, tY, 100, 40, 'Express', C.success, 'express.json()')
drawArrow(ML + 345, tY + 20, ML + 365, tY + 20, '', '#059669')
drawFlowBox(ML + 365, tY, 115, 40, 'PostgreSQL', '#059669', 'posts.content JSONB')

doc.y = tY + 55

drawFlowBox(ML + 365, tY + 55, 115, 40, 'SELECT *', '#059669', 'JSONB \u2192 JS \uAC1D\uCCB4')
drawArrow(ML + 365, tY + 75, ML + 345, tY + 75, '', C.secondary)
drawFlowBox(ML + 245, tY + 55, 100, 40, 'res.json()', C.secondary, '\uC790\uB3D9 \uC9C1\uB82C\uD654')
drawArrow(ML + 245, tY + 75, ML + 225, tY + 75, '', C.primary)
drawFlowBox(ML + 125, tY + 55, 100, 40, 'React Query', C.primary, 'usePost(id)')
drawArrow(ML + 125, tY + 75, ML + 105, tY + 75, '', '#6D28D9')
drawFlowBox(ML, tY + 55, 105, 40, 'TiptapViewer', '#6D28D9', 'editable: false')

doc.y = tY + 115

drawParagraph('\uBAA8\uB4E0 \uB2E8\uACC4\uC5D0\uC11C JSON.stringify / JSON.parse \uB97C \uBA85\uC2DC\uC801\uC73C\uB85C \uD638\uCD9C\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.')
drawBullet('fetch: body \uC5D0 JSON.stringify(data) \u2192 express.json() \uC774 \uC790\uB3D9 \uD30C\uC2F1')
drawBullet('pg \uB4DC\uB77C\uC774\uBC84: JSONB \uCEEC\uB7FC\uC744 \uC790\uB3D9\uC73C\uB85C JS \uAC1D\uCCB4\uB85C \uBCC0\uD658')
drawBullet('TiptapViewer: content prop\uC73C\uB85C \uAC1D\uCCB4\uB97C \uADF8\uB300\uB85C \uC804\uB2EC\uD558\uBA74 \uB80C\uB354\uB9C1')


// ════════════════════════════════════════════════════════════
// 7. 보안 전략
// ════════════════════════════════════════════════════════════
drawTitle('7. \uBCF4\uC548 \uC804\uB7B5 \uC694\uC57D')

drawTable(
  ['\uC704\uD611', '\uBC29\uC5B4 \uC218\uB2E8', '\uAD6C\uD604 \uC704\uCE58'],
  [
    ['XSS \uD1A0\uD070 \uD0C8\uCDE8', 'Access Token\uC744 \uBA54\uBAA8\uB9AC(Redux)\uC5D0\uB9CC \uC800\uC7A5', 'authSlice.js'],
    ['XSS \uCFE0\uD0A4 \uD0C8\uCDE8', 'Refresh Token\uC744 HttpOnly \uCFE0\uD0A4\uB85C \uC124\uC815', 'routes/auth.js'],
    ['CSRF', 'SameSite: strict/lax + credentials', 'REFRESH_COOKIE_OPTS'],
    ['\uD1A0\uD070 \uC7A5\uAE30 \uB178\uCD9C', 'Access Token 15\uBD84\uC73C\uB85C \uC9E7\uAC8C \uC720\uC9C0', 'createAccessToken()'],
    ['Refresh \uD0C8\uCDE8', 'Refresh Token Rotation (\uB9E4\uBC88 \uC0C8\uB85C \uBC1C\uAE09)', 'POST /auth/refresh'],
    ['Brute Force', 'bcryptjs hash (salt round 12)', 'routes/auth.js'],
  ],
  [95, 220, 180]
)

doc.moveDown(0.5)

drawCodeBlock([
  '// \uCFE0\uD0A4 \uC635\uC158 \u2014 \uBCF4\uC548 \uC124\uC815',
  'const REFRESH_COOKIE_OPTS = {',
  '  httpOnly: true,              // JS \uC811\uADFC \uCC28\uB2E8 \u2192 XSS \uBC29\uC5B4',
  '  secure:   isProd,            // HTTPS \uC804\uC6A9 (production)',
  '  sameSite: isProd             // CSRF \uBC29\uC5B4',
  '    ? \'strict\'                 //   prod: \uC678\uBD80 \uC694\uCCAD \uCFE0\uD0A4 \uCC28\uB2E8',
  '    : \'lax\',                   //   dev:  GET \uD5C8\uC6A9',
  '  path: \'/api/auth\',           // \uCFE0\uD0A4 \uBC94\uC704 \uC81C\uD55C',
  '  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7\uC77C',
  '}',
], 'backend/src/routes/auth.js')


// ════════════════════════════════════════════════════════════
// 8. 엔드포인트 레퍼런스
// ════════════════════════════════════════════════════════════
doc.addPage()
drawTitle('8. \uC5D4\uB4DC\uD3EC\uC778\uD2B8 \uB808\uD37C\uB7F0\uC2A4')

drawSubtitle('\uC778\uC99D API')
drawTable(
  ['\uBA54\uC11C\uB4DC', '\uACBD\uB85C', '\uC785\uB825', '\uCD9C\uB825', '\uBE44\uACE0'],
  [
    ['POST', '/api/auth/login', 'email, password', 'accessToken + Set-Cookie', '\uB85C\uADF8\uC778'],
    ['POST', '/api/auth/refresh', 'Cookie: refreshToken', 'accessToken + \uC0C8 Cookie', '\uD1A0\uD070 \uAC31\uC2E0'],
    ['GET', '/api/auth/me', 'Cookie: refreshToken', 'admin + accessToken', '\uC138\uC158 \uBCF5\uC6D0'],
    ['POST', '/api/auth/logout', 'Cookie: refreshToken', 'Clear-Cookie', '\uB85C\uADF8\uC544\uC6C3'],
  ],
  [40, 110, 110, 115, 120]
)

drawSubtitle('\uAC8C\uC2DC\uAE00 API')
drawTable(
  ['\uBA54\uC11C\uB4DC', '\uACBD\uB85C', '\uC778\uC99D', '\uC785\uB825', '\uCD9C\uB825'],
  [
    ['GET', '/api/posts', '\u274C', '?category&search&page&limit', '{ data, pagination }'],
    ['GET', '/api/posts/:id', '\u274C', 'URL param', '{ data: post }'],
    ['POST', '/api/posts', '\u2705 Bearer', 'title, content(JSONB)...', '201 { data: post }'],
    ['PUT', '/api/posts/:id', '\u2705 Bearer', '\uBD80\uBD84 \uD544\uB4DC \uAC00\uB2A5', '{ data: post }'],
    ['DELETE', '/api/posts/:id', '\u2705 Bearer', 'URL param', '204 No Content'],
  ],
  [50, 105, 65, 130, 145]
)

drawSubtitle('Redux \uC561\uC158 (\uC778\uC99D \uC0C1\uD0DC \uAD00\uB9AC)')
drawTable(
  ['\uC561\uC158', '\uD2B8\uB9AC\uAC70 \uC2DC\uC810', 'payload', '\uD6A8\uACFC'],
  [
    ['loginSuccess', '\uB85C\uADF8\uC778 / /me \uC131\uACF5', '{ accessToken }', 'isAdmin=true, token \uC800\uC7A5'],
    ['tokenRefreshed', 'fetchWithAuth 401 \u2192 refresh \uC131\uACF5', '{ accessToken }', 'token\uB9CC \uAD50\uCCB4'],
    ['logout', '\uB85C\uADF8\uC544\uC6C3 / refresh \uC2E4\uD328', '\u2014', 'isAdmin=false, token=null'],
    ['authChecked', 'App mount \uC2DC /me \uBBF8\uC778\uC99D', '\u2014', 'initialized=true'],
  ],
  [90, 145, 100, 160]
)


// ── 마지막 페이지: 파일 구조 ────────────────────────────────
doc.addPage()
drawSubtitle('\uD504\uB85C\uC81D\uD2B8 \uD30C\uC77C \uAD6C\uC870 (\uC778\uC99D/API \uAD00\uB828)')

drawCodeBlock([
  'MainProject/',
  '\u251C\u2500\u2500 frontend/src/',
  '\u2502   \u251C\u2500\u2500 api/',
  '\u2502   \u2502   \u251C\u2500\u2500 auth.js           # loginAdmin, refreshAccessToken,',
  '\u2502   \u2502   \u2502                     #   logoutAdmin, checkAuthSession',
  '\u2502   \u2502   \u251C\u2500\u2500 fetchWithAuth.js  # 401 \uC778\uD130\uC149\uD130 + \uC790\uB3D9 refresh',
  '\u2502   \u2502   \u2514\u2500\u2500 posts.js          # usePosts, useCreatePost...',
  '\u2502   \u251C\u2500\u2500 store/',
  '\u2502   \u2502   \u2514\u2500\u2500 authSlice.js      # accessToken(memory), isAdmin',
  '\u2502   \u251C\u2500\u2500 components/common/',
  '\u2502   \u2502   \u2514\u2500\u2500 LoginModal.jsx    # \uB85C\uADF8\uC778 UI + dispatch',
  '\u2502   \u2514\u2500\u2500 App.jsx               # AuthInit (\uC138\uC158 \uBCF5\uC6D0)',
  '\u2502',
  '\u2514\u2500\u2500 backend/src/',
  '    \u251C\u2500\u2500 routes/',
  '    \u2502   \u251C\u2500\u2500 auth.js           # login, refresh, me, logout',
  '    \u2502   \u2514\u2500\u2500 posts.js          # CRUD + requireAuth',
  '    \u251C\u2500\u2500 middleware/',
  '    \u2502   \u2514\u2500\u2500 auth.js           # requireAuth (Bearer \uAC80\uC99D)',
  '    \u2514\u2500\u2500 config/',
  '        \u2514\u2500\u2500 db.js             # pg Pool (PostgreSQL)',
], '\uD504\uB85C\uC81D\uD2B8 \uAD6C\uC870')


// ── 끝 ────────────────────────────────────────────────────
doc.end()

stream.on('finish', () => {
  console.log(`\u2705 PDF \uC0DD\uC131 \uC644\uB8CC: ${OUTPUT}`)
})
