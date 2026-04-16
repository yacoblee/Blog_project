import styles from './ResumePage.module.css'

/* ── 이력서 데이터 ───────────────────────────────────────── */
const PROFILE = {
  name:    '이승현',
  birth:   '1994년생 (만 31세)',
  email:   'yacobleee@naver.com',
  phone:   '010-4052-9406',
  tagline: '전체 구조를 보는 넓은 시야로 문제를 해결하는 개발자',
}

const CAREERS = [
  {
    period:   '2024.11 ~ 현재',
    duration: '약 6개월',
    company:  'SI 기업',
    role:     '풀스택 개발자',
    salary:   '연봉 3,800만원',
    current:  true,
    tasks: [
      'SKT 프로젝트 참여 — Jetpack Compose(Android) + React(Web) 풀스택 개발',
      'Redux / RTK Query 적용, Kotlin(Native)·React 간 API 연동 및 pin 기능 구현',
      'Jenkins CI/CD 파이프라인 구축 및 Spring Boot 서버 배포 자동화',
      '2025년 11월 납기 목표로 프로젝트 진행 중',
    ],
    skills: ['Jetpack Compose', 'Kotlin', 'React', 'Redux', 'RTK Query', 'Spring Boot', 'Jenkins', 'AWS EC2'],
  },
  {
    period:   '2023.03 ~ 2024.02',
    duration: '1년',
    company:  '웹 개발 기업',
    role:     '백엔드 / 풀스택 개발자',
    salary:   '연봉 3,500만원',
    current:  false,
    tasks: [
      'fdmis.co.kr 웹 서비스 유지보수 및 신규 기능 개발',
      'Spring·JSP 기반 레거시 시스템 UX 개선 및 리팩토링',
      'PostgreSQL 쿼리 최적화 및 데이터 처리 로직 개선',
    ],
    skills: ['Spring', 'JSP', 'JavaScript', 'PostgreSQL', 'Java'],
  },
  {
    period:   '2021.04 ~ 2022.10',
    duration: '1년 7개월',
    company:  'KT 협력사',
    role:     '시스템 운용 엔지니어',
    salary:   '연봉 3,300만원',
    current:  false,
    tasks: [
      'KT 네트워크 인프라 Linux 서버 운용 및 유지보수',
      '장애 대응 및 시스템 모니터링 업무 수행',
      '서버 환경 설정·배포 스크립트 관리',
    ],
    skills: ['Linux', 'Shell Script', 'C', 'Network'],
  },
]

const EDUCATION = [
  {
    period: '2019.03 ~ 2021.03',
    school: '대학교',
    detail: '학점 3.54 / 4.5',
    type:   '대졸',
  },
  {
    period: '2010.02 ~ 2013.02',
    school: '고등학교',
    detail: '졸업',
    type:   '고졸',
  },
]

const CERTS = [
  { name: 'SQL 개발자 (SQLD)', date: '2024.09', issuer: '한국데이터산업진흥원' },
  { name: 'SQL 개발자 (SQLD)', date: '2021.11', issuer: '한국데이터산업진흥원' },
]

const PROJECTS = [
  {
    period: '2026.03 ~ 2026.04',
    name:   'WinForm ML 프로젝트',
    team:   '1인 개발',
    stack:  ['Visual Studio 2022', 'ML-D', 'C#'],
    desc:   'ML-D 라이브러리를 활용한 머신러닝 WinForm 애플리케이션 개발. 데이터 시각화, 예측 모델 학습/평가 기능 구현.',
  },
  {
    period: '2024.05 ~ 2024.10',
    name:   'JPA 기반 백엔드 시스템',
    team:   '4인 팀',
    stack:  ['Java', 'JPA', 'Spring Boot', 'AWS EC2', 'Docker', 'Eclipse'],
    desc:   'JPA(A, B, C 파트) 설계 및 구현. Docker 컨테이너화 후 AWS EC2 배포. CI/CD 파이프라인 적용.',
  },
  {
    period: '2021.02 ~ 2021.03',
    name:   'Fundigo 크라우드 펀딩 플랫폼',
    team:   '3인 팀',
    stack:  ['Spring', 'Oracle', 'JSP', 'HTML/CSS', 'JavaScript'],
    desc:   'STS·Oracle 환경에서 Spring MVC 기반 크라우드 펀딩 웹 플랫폼 개발. 프로젝트 등록·후원 흐름 설계 및 구현.',
    link:   'https://github.com/WebProject21/Fundigo.git',
  },
  {
    period: '2020.11 ~ 2020.12',
    name:   'HTML/CSS 교육 수료 프로젝트',
    team:   '개인',
    stack:  ['HTML', 'CSS', 'JavaScript'],
    desc:   '1개월 과정 웹 퍼블리싱 교육 수료 프로젝트. 반응형 레이아웃 및 기본 인터랙션 구현.',
  },
]

const SKILLS = [
  { category: 'Backend',        items: ['Java', 'Spring Framework', 'Spring Boot', 'JSP', 'Oracle', 'PostgreSQL'] },
  { category: 'Frontend / App', items: ['React', 'Redux', 'RTK Query', 'Kotlin', 'Jetpack Compose'] },
  { category: 'DevOps / Infra', items: ['AWS EC2', 'Docker', 'Jenkins', 'Linux', 'Git'] },
  { category: 'Languages',      items: ['Java', 'Kotlin', 'JavaScript', 'C', 'C#'] },
]

/* ── 컴포넌트 ───────────────────────────────────────────── */
export default function ResumePage() {
  return (
    <div className={styles.page}>

      {/* ══ HERO — 프로필 카드 ══ */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>

          {/* 사진 */}
          <div className={styles.avatarWrap}>
            <div className={styles.avatar}>
              <span className={styles.avatarInitial}>이</span>
            </div>
            <span className={styles.availBadge}>✅ 재직 중</span>
          </div>

          {/* 기본 정보 */}
          <div className={styles.heroInfo}>
            <h1 className={styles.heroName}>{PROFILE.name}</h1>
            <p className={styles.heroTagline}>{PROFILE.tagline}</p>

            <div className={styles.heroBadges}>
              <span className={styles.badge}>👤 {PROFILE.birth}</span>
              <a  className={styles.badge} href={`mailto:${PROFILE.email}`}>
                ✉️ {PROFILE.email}
              </a>
              <span className={styles.badge}>📞 {PROFILE.phone}</span>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.container}>

        {/* ══ 경력 ══ */}
        <Section icon="💼" title="경력" sub={`총 ${CAREERS.length}개 직장 · 약 3년 2개월`}>
          <div className={styles.timeline}>
            {CAREERS.map((c, i) => (
              <div key={i} className={`${styles.timelineItem} ${c.current ? styles.current : ''}`}>
                <div className={styles.timelineDot} />

                <div className={styles.timelineCard}>
                  <div className={styles.cardHead}>
                    <div>
                      <h3 className={styles.cardCompany}>
                        {c.company}
                        {c.current && <span className={styles.nowTag}>재직 중</span>}
                      </h3>
                      <p className={styles.cardRole}>{c.role}</p>
                    </div>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardPeriod}>{c.period}</span>
                      <span className={styles.cardDuration}>{c.duration}</span>
                      <span className={styles.cardSalary}>{c.salary}</span>
                    </div>
                  </div>

                  <ul className={styles.taskList}>
                    {c.tasks.map((t, j) => (
                      <li key={j} className={styles.taskItem}>{t}</li>
                    ))}
                  </ul>

                  <div className={styles.skillTags}>
                    {c.skills.map(s => (
                      <span key={s} className={styles.skillTag}>{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ══ 학력 ══ */}
        <Section icon="🎓" title="학력">
          <div className={styles.eduList}>
            {EDUCATION.map((e, i) => (
              <div key={i} className={styles.eduItem}>
                <div className={styles.eduLeft}>
                  <span className={styles.eduPeriod}>{e.period}</span>
                </div>
                <div className={styles.eduRight}>
                  <span className={styles.eduSchool}>{e.school}</span>
                  <span className={styles.eduDetail}>{e.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ══ 자격증 ══ */}
        <Section icon="📜" title="자격증">
          <div className={styles.certList}>
            {CERTS.map((c, i) => (
              <div key={i} className={styles.certItem}>
                <span className={styles.certName}>{c.name}</span>
                <span className={styles.certDate}>{c.date} 취득</span>
                <span className={styles.certIssuer}>{c.issuer}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ══ 프로젝트 ══ */}
        <Section icon="🛠️" title="프로젝트" sub="연도 순">
          <div className={styles.projectGrid}>
            {PROJECTS.map((p, i) => (
              <div key={i} className={styles.projectCard}>
                <div className={styles.projectHead}>
                  <span className={styles.projectPeriod}>{p.period}</span>
                  <span className={styles.projectTeam}>{p.team}</span>
                </div>
                <h4 className={styles.projectName}>{p.name}</h4>
                <p className={styles.projectDesc}>{p.desc}</p>
                <div className={styles.skillTags}>
                  {p.stack.map(s => (
                    <span key={s} className={styles.skillTag}>{s}</span>
                  ))}
                </div>
                {p.link && (
                  <a href={p.link} target="_blank" rel="noopener noreferrer"
                     className={styles.projectLink}>
                    GitHub →
                  </a>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* ══ 기술 스택 ══ */}
        <Section icon="⚙️" title="기술 스택">
          <div className={styles.skillGrid}>
            {SKILLS.map((g, i) => (
              <div key={i} className={styles.skillGroup}>
                <h4 className={styles.skillCategory}>{g.category}</h4>
                <div className={styles.skillTags}>
                  {g.items.map(s => (
                    <span key={s} className={styles.skillTag}>{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

      </div>
    </div>
  )
}

/* ── 섹션 래퍼 ── */
function Section({ icon, title, sub, children }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}>{icon}</span>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {sub && <span className={styles.sectionSub}>{sub}</span>}
      </div>
      {children}
    </section>
  )
}
