/**
 * 마이그레이션 + 초기 admin 계정 생성
 * 실행: node migrations/migrate.js
 */
require('dotenv').config()

const fs     = require('fs')
const path   = require('path')
const bcrypt = require('bcryptjs')
const pool   = require('../src/config/db')

async function main() {
  const client = await pool.connect()
  try {
    console.log('⏳ DB 마이그레이션 시작...')

    // SQL 파일 실행 — 디렉터리 내 *.sql 을 파일명 순으로 모두 실행
    const sqlFiles = fs.readdirSync(__dirname)
      .filter(f => f.endsWith('.sql'))
      .sort()
    for (const f of sqlFiles) {
      const sql = fs.readFileSync(path.join(__dirname, f), 'utf8')
      await client.query(sql)
      console.log(`  ✓ ${f}`)
    }
    console.log('✅ 스키마 적용 완료')

    // Admin 계정 생성 (없을 때만)
    const email    = process.env.ADMIN_EMAIL    || 'admin@example.com'
    const password = process.env.ADMIN_PASSWORD || 'changeme123!'

    const { rows } = await client.query(
      'SELECT id FROM admins WHERE email = $1',
      [email]
    )
    if (rows.length === 0) {
      const hash = await bcrypt.hash(password, 12)
      await client.query(
        'INSERT INTO admins (email, password_hash) VALUES ($1, $2)',
        [email, hash]
      )
      console.log(`✅ Admin 계정 생성: ${email}`)
    } else {
      console.log(`ℹ️  Admin 계정이 이미 존재합니다: ${email}`)
    }

    console.log('🎉 마이그레이션 완료!')
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error('❌ 마이그레이션 실패:', err)
  process.exit(1)
})
