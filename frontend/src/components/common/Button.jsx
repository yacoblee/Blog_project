import styles from './Button.module.css'

/**
 * 재사용 가능한 Button 컴포넌트
 * @param {string} variant - 'primary' | 'secondary' | 'outline' | 'ghost'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {string} className - 추가 CSS 클래스
 * @param {ReactNode} children - 버튼 내용
 * @param {object} props - 나머지 속성 (onClick, disabled 등)
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  const buttonClass = `
    ${styles.btn}
    ${styles[`btn--${variant}`]}
    ${styles[`btn--${size}`]}
    ${className}
  `.trim()

  return (
    <button className={buttonClass} {...props}>
      {children}
    </button>
  )
}
