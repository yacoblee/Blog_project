import { useScrollReveal } from '../hooks/useScrollReveal'
import styles from './MainPage.module.css'
import heroBgVideo from '../assets/001_In_a_charming_animated.mp4'

const SKILLS = [
  'React', 'Node.js', 'TypeScript', 'JavaScript',
  'PostgreSQL', 'Docker', 'Nginx', 'Git', 'Redis', 'REST API',
]

function RevealCard({ children, className, delay = 0 }) {
  const ref = useScrollReveal()
  return (
    <div
      ref={ref}
      className={`reveal ${className || ''}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}

export default function MainPage() {
  return (
    <div className={styles.page}>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        {/* 배경 동영상 */}
        <video
          className={styles.heroBgVideo}
          autoPlay
          loop
          muted
          playsInline
          poster={heroBgVideo}
        >
          <source src={heroBgVideo} type="video/mp4" />
          브라우저가 비디오를 지원하지 않습니다.
        </video>
        <div className={styles.heroOverlay} />

        <div className={styles.heroContent}>
          <div className={styles.avatar}>DEV</div>
          <h1 className={styles.name}>안녕하세요, 개발자입니다</h1>
          <p className={styles.role}>Frontend & Backend Engineer</p>
          <p className={styles.bio}>
            React와 Node.js를 기반으로 풀스택 개발을 합니다.<br />
            좋은 코드와 좋은 사용자 경험을 만들기 위해 노력합니다.
          </p>
          <div className={styles.heroLinks}>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className={styles.heroBtn}
            >
              GitHub
            </a>
            <a href="/resume" className={`${styles.heroBtn} ${styles.heroBtnFill}`}>
              이력서 보기
            </a>
          </div>
        </div>

        <div className={styles.scrollIndicator}>
          <span>SCROLL</span>
          <div className={styles.scrollArrow} />
        </div>
      </section>

      {/* ── Content (scrolls over fixed bg) ── */}
      <div className={styles.content}>

        {/* About */}
        <section className={styles.section}>
          <RevealCard>
            <h2 className={styles.sectionHeading}>About Me</h2>
          </RevealCard>
          <div className={styles.aboutGrid}>
            {[
              {
                icon: '💻',
                title: 'Frontend',
                desc: 'React, TypeScript, Vite, Tailwind CSS를 활용한 모던 UI 개발',
              },
              {
                icon: '⚙️',
                title: 'Backend',
                desc: 'Node.js + Express, PostgreSQL, REST API 설계 및 구축',
              },
              {
                icon: '🚀',
                title: 'DevOps',
                desc: 'Docker, Nginx 기반 컨테이너화 및 배포 환경 구성',
              },
            ].map(({ icon, title, desc }, i) => (
              <RevealCard key={title} className={styles.aboutCard} delay={i * 100}>
                <div className={styles.cardIcon}>{icon}</div>
                <h3 className={styles.cardTitle}>{title}</h3>
                <p className={styles.cardDesc}>{desc}</p>
              </RevealCard>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section className={styles.section}>
          <RevealCard>
            <h2 className={styles.sectionHeading}>Skills</h2>
          </RevealCard>
          <RevealCard className={styles.skillList}>
            {SKILLS.map(skill => (
              <span key={skill} className={styles.skillTag}>{skill}</span>
            ))}
          </RevealCard>
        </section>

        {/* Recent Posts */}
        <section className={styles.section}>
          <RevealCard>
            <h2 className={styles.sectionHeading}>Recent Posts</h2>
          </RevealCard>
          <RevealCard className={styles.postsPlaceholder}>
            <p>블로그 게시글이 곧 추가됩니다.</p>
            <a href="/blog" className={styles.viewAll}>블로그 바로가기 →</a>
          </RevealCard>
        </section>

      </div>
    </div>
  )
}
