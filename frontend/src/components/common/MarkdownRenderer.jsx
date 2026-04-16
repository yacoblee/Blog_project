import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default function MarkdownRenderer({ content, className }) {
  return (
    <div className={className}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // 코드 블록 — 언어 감지 후 syntax highlight
        code({ node, className: cls, children, ...props }) {
          const match = /language-(\w+)/.exec(cls || '')
          const language = match ? match[1] : ''
          const isBlock = node?.position?.start?.line !== node?.position?.end?.line || language

          if (isBlock && language) {
            return (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={language}
                PreTag="div"
                customStyle={{
                  borderRadius: '8px',
                  margin: '16px 0',
                  fontSize: '13px',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            )
          }

          // 인라인 코드 (언어 지정 없는 블록 포함)
          return (
            <code className={cls} {...props}>
              {children}
            </code>
          )
        },

        // 링크 — 외부 링크는 새 탭으로
        a({ href, children, ...props }) {
          const isExternal = href?.startsWith('http')
          return (
            <a
              href={href}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              {...props}
            >
              {children}
            </a>
          )
        },
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  )
}
