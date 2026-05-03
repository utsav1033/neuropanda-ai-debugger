// app/page.tsx
"use client"

import { useState } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function Home() {
  const [formData, setFormData] = useState({
    error_text: '',
    log_excerpt: '',
    code_file: '',
    service_name: '',
    repo_link: ''
  })

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [loadingStep, setLoadingStep] = useState(0)

  const LOADING_STEPS = [
    'SCANNING ERROR MATRIX...',
    'QUERYING INCIDENT DATABASE...',
    'RUNNING NEURAL ANALYSIS...',
    'SYNTHESIZING ROOT CAUSE...',
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLoadingStep(0)

    const stepInterval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % LOADING_STEPS.length)
    }, 900)

    try {
      const response = await axios.post(
        `${API_URL}/analyze_error`,
        formData
      )
      setResult(response.data)
    } catch (error) {
      console.error(error)
    }

    clearInterval(stepInterval)
    setLoading(false)
  }

  if (result) {
    return <ResultsPage result={result} onBack={() => setResult(null)} />
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', zIndex: 1, padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-block',
            fontFamily: 'var(--font-game)',
            fontSize: '0.65rem',
            letterSpacing: '0.35em',
            color: 'var(--neon-cyan)',
            background: 'rgba(0,245,255,0.08)',
            border: '1px solid rgba(0,245,255,0.3)',
            padding: '4px 16px',
            marginBottom: '1rem',
            animation: 'pulse-glow 2s ease-in-out infinite'
          }}>
            ◆ SYSTEM ONLINE ◆
          </div>
          <h1 style={{
            fontFamily: 'var(--font-game)',
            fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
            fontWeight: 900,
            margin: 0,
            background: 'linear-gradient(90deg, var(--neon-cyan), #fff, var(--neon-green))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '0.05em',
          }}>
            NEUROPANDA
          </h1>
          <div style={{
            fontFamily: 'var(--font-game)',
            fontSize: '0.7rem',
            letterSpacing: '0.2em',
            color: 'var(--neon-green)',
            marginTop: '4px',
            marginBottom: '4px',
          }}>AI DEBUGGER</div>
          <p style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            marginTop: '0.5rem',
            letterSpacing: '0.08em',
          }}>
            &gt; PASTE YOUR ERROR · ROOT CAUSE ANALYSIS · ETA: ~3s_
          </p>
        </div>

        {/* Form Card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-dim)',
          borderRadius: '4px',
          padding: '2rem',
          position: 'relative',
          clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)',
          boxShadow: '0 0 40px rgba(0,245,255,0.08), inset 0 0 40px rgba(0,0,0,0.4)',
        }}>
          {/* Corner accent */}
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: '20px', height: '20px',
            background: 'var(--neon-cyan)',
            clipPath: 'polygon(100% 0, 100% 100%, 0 0)',
          }} />

          {/* Card title bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '1.5rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border-dim)',
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--neon-red)', boxShadow: '0 0 6px var(--neon-red)' }} />
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--neon-yellow)', boxShadow: '0 0 6px var(--neon-yellow)' }} />
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--neon-green)', boxShadow: '0 0 6px var(--neon-green)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>
              error_analysis.exe
            </span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <Field label="ERROR MESSAGE" required badge="REQUIRED" color="var(--neon-red)">
              <textarea
                required
                rows={3}
                placeholder="TimeoutError: POST /api/payments timed out after 30s"
                value={formData.error_text}
                onChange={(e) => setFormData({ ...formData, error_text: e.target.value })}
                style={textareaStyle}
              />
            </Field>

            <Field label="LOG EXCERPT" badge="OPTIONAL" color="var(--neon-cyan)">
              <textarea
                rows={4}
                placeholder="2025-04-28T14:32:15Z ERROR payment-api: connection timeout..."
                value={formData.log_excerpt}
                onChange={(e) => setFormData({ ...formData, log_excerpt: e.target.value })}
                style={textareaStyle}
              />
            </Field>

            <Field label="CODE SNIPPET" badge="OPTIONAL" color="var(--neon-cyan)">
              <textarea
                rows={4}
                placeholder="def process_payment(order):..."
                value={formData.code_file}
                onChange={(e) => setFormData({ ...formData, code_file: e.target.value })}
                style={textareaStyle}
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Field label="SERVICE NAME" required badge="REQUIRED" color="var(--neon-red)">
                <input
                  required
                  type="text"
                  placeholder="payment-api"
                  value={formData.service_name}
                  onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                  style={inputStyle}
                />
              </Field>

              <Field label="REPO LINK" badge="OPTIONAL" color="var(--neon-cyan)">
                <input
                  type="text"
                  placeholder="https://github.com/user/repo"
                  value={formData.repo_link}
                  onChange={(e) => setFormData({ ...formData, repo_link: e.target.value })}
                  style={inputStyle}
                />
              </Field>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.9rem',
                fontFamily: 'var(--font-game)',
                fontSize: '0.85rem',
                fontWeight: 700,
                letterSpacing: '0.15em',
                color: loading ? 'var(--text-muted)' : '#000',
                background: loading
                  ? 'rgba(0,245,255,0.05)'
                  : 'linear-gradient(90deg, var(--neon-cyan), var(--neon-green))',
                border: `1px solid ${loading ? 'var(--border-dim)' : 'transparent'}`,
                borderRadius: '2px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)',
                boxShadow: loading ? 'none' : '0 0 24px rgba(0,245,255,0.4)',
              }}
            >
              {loading ? (
                <span style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)' }}>
                  ⏳ {LOADING_STEPS[loadingStep]}
                </span>
              ) : (
                '⚡ ANALYZE ERROR'
              )}
            </button>

          </form>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          marginTop: '1.5rem',
          letterSpacing: '0.1em',
        }}>
          NEUROPANDA · RAG + GEMINI AI · v1.0.0
        </p>
      </div>
    </div>
  )
}

/* ── Reusable Field wrapper ── */
function Field({ label, children, badge, color, required }: any) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <span style={{
          fontFamily: 'var(--font-game)',
          fontSize: '0.65rem',
          letterSpacing: '0.12em',
          color: 'var(--text-secondary)',
        }}>
          {label}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.55rem',
          padding: '1px 6px',
          border: `1px solid ${color}`,
          color: color,
          borderRadius: '2px',
          letterSpacing: '0.08em',
          opacity: 0.75,
        }}>
          {badge}
        </span>
      </div>
      {children}
    </div>
  )
}

/* ── Shared input styles ── */
const textareaStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-input)',
  border: '1px solid var(--border-dim)',
  borderRadius: '2px',
  padding: '10px 12px',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.8rem',
  color: 'var(--text-primary)',
  resize: 'vertical',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-input)',
  border: '1px solid var(--border-dim)',
  borderRadius: '2px',
  padding: '10px 12px',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.8rem',
  color: 'var(--text-primary)',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
}

/* ═══════════════════════════════════════════════
   RESULTS PAGE
═══════════════════════════════════════════════ */
function ResultsPage({ result, onBack }: any) {
  const score = Math.round(result.confidence.score * 100)

  return (
    <div style={{ position: 'relative', minHeight: '100vh', zIndex: 1, padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>

        {/* Header bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-game)',
              fontSize: '0.6rem',
              letterSpacing: '0.3em',
              color: 'var(--neon-green)',
              marginBottom: '4px',
            }}>
              ◆ ANALYSIS COMPLETE ◆
            </div>
            <h1 style={{
              fontFamily: 'var(--font-game)',
              fontSize: 'clamp(1.4rem, 4vw, 2rem)',
              margin: 0,
              background: 'linear-gradient(90deg, var(--neon-cyan), #fff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              DIAGNOSTIC REPORT
            </h1>
          </div>
          <button
            onClick={onBack}
            style={{
              fontFamily: 'var(--font-game)',
              fontSize: '0.65rem',
              letterSpacing: '0.12em',
              color: 'var(--neon-cyan)',
              background: 'transparent',
              border: '1px solid var(--border-glow)',
              padding: '8px 16px',
              cursor: 'pointer',
              borderRadius: '2px',
              transition: 'all 0.2s',
            }}
          >
            ← NEW SCAN
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Root Cause */}
          <ResultCard
            title="🎯 ROOT CAUSE"
            accentColor="var(--neon-red)"
            animationDelay="0ms"
          >
            <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: 'var(--text-primary)', margin: '0 0 12px' }}>
              {result.root_cause}
            </p>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'var(--neon-red)',
              background: 'rgba(255,0,60,0.08)',
              border: '1px solid rgba(255,0,60,0.2)',
              padding: '6px 12px',
              borderRadius: '2px',
              display: 'inline-block',
            }}>
              📄 {result.affected_file} &nbsp;·&nbsp; LINE {result.affected_line}
            </div>
          </ResultCard>

          {/* Confidence */}
          <ResultCard title="📊 CONFIDENCE SCORE" accentColor="var(--neon-cyan)" animationDelay="80ms">
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-game)',
                  fontSize: '3.5rem',
                  fontWeight: 900,
                  color: score >= 70 ? 'var(--neon-green)' : score >= 40 ? 'var(--neon-yellow)' : 'var(--neon-red)',
                  textShadow: `0 0 20px ${score >= 70 ? 'var(--neon-green)' : score >= 40 ? 'var(--neon-yellow)' : 'var(--neon-red)'}`,
                  lineHeight: 1,
                }}>
                  {score}%
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.1em',
                  marginTop: '4px',
                }}>
                  CONFIDENCE
                </div>
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                {/* Progress bar */}
                <div style={{
                  height: '6px',
                  background: 'rgba(0,245,255,0.1)',
                  borderRadius: '3px',
                  marginBottom: '12px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${score}%`,
                    background: score >= 70 ? 'linear-gradient(90deg, var(--neon-cyan), var(--neon-green))' : score >= 40 ? 'var(--neon-yellow)' : 'var(--neon-red)',
                    borderRadius: '3px',
                    boxShadow: `0 0 8px ${score >= 70 ? 'var(--neon-green)' : 'var(--neon-yellow)'}`,
                    transition: 'width 1s ease',
                  }} />
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 6px', lineHeight: 1.5 }}>
                  {result.confidence.reasoning}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  ⚠ {result.confidence.uncertainty}
                </p>
              </div>
            </div>
          </ResultCard>

          {/* Related Commits */}
          <ResultCard title="🔗 RELATED COMMITS" accentColor="var(--neon-purple)" animationDelay="160ms">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {result.related_commits.map((commit: any, idx: number) => (
                <div key={idx} style={{
                  background: 'rgba(191,0,255,0.05)',
                  border: '1px solid rgba(191,0,255,0.2)',
                  borderRadius: '2px',
                  padding: '12px',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-game)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--neon-purple)',
                    flexShrink: 0,
                  }}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div style={{ flex: 1 }}>
                    <a
                      href={commit.github_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem',
                        color: 'var(--neon-purple)',
                        textDecoration: 'none',
                      }}
                    >
                      {commit.hash}
                    </a>
                    <p style={{ margin: '4px 0 2px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {commit.message}
                    </p>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                    }}>
                      RELEVANCE: {commit.relevance_score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ResultCard>

          {/* Similar Incidents */}
          <ResultCard title="⏰ SIMILAR INCIDENTS" accentColor="var(--neon-orange)" animationDelay="240ms">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {result.similar_incidents.map((incident: any, idx: number) => (
                <div key={idx} style={{
                  background: 'rgba(255,107,0,0.05)',
                  border: '1px solid rgba(255,107,0,0.2)',
                  borderLeft: '3px solid var(--neon-orange)',
                  borderRadius: '2px',
                  padding: '12px 16px',
                }}>
                  <h3 style={{ margin: '0 0 6px', fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                    {incident.title}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 4px' }}>
                    FIX: {incident.fix_applied}
                  </p>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    color: 'var(--neon-green)',
                    background: 'rgba(0,255,136,0.08)',
                    padding: '2px 8px',
                    borderRadius: '2px',
                    border: '1px solid rgba(0,255,136,0.2)',
                  }}>
                    ✓ RESOLVED IN {incident.resolution_time} MIN
                  </span>
                </div>
              ))}
            </div>
          </ResultCard>

          {/* Reasoning Chain */}
          <ResultCard title="🧠 REASONING CHAIN" accentColor="var(--neon-cyan)" animationDelay="320ms">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'RETRIEVAL', value: result.reasoning_chain.retrieval, color: 'var(--neon-cyan)' },
                { label: 'ANALYSIS', value: result.reasoning_chain.analysis, color: 'var(--neon-green)' },
                { label: 'ALTERNATIVES', value: JSON.stringify(result.reasoning_chain.alternatives), color: 'var(--neon-purple)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', gap: '12px' }}>
                  <div style={{
                    fontFamily: 'var(--font-game)',
                    fontSize: '0.6rem',
                    letterSpacing: '0.08em',
                    color,
                    flexShrink: 0,
                    paddingTop: '2px',
                    minWidth: '90px',
                  }}>
                    [{label}]
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    borderLeft: `2px solid ${color}`,
                    paddingLeft: '12px',
                    opacity: 0.8,
                  }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </ResultCard>

          {/* Next Steps */}
          <ResultCard title="✅ NEXT STEPS" accentColor="var(--neon-green)" animationDelay="400ms">
            <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {result.next_steps.map((step: string, idx: number) => (
                <li key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{
                    fontFamily: 'var(--font-game)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--neon-green)',
                    background: 'rgba(0,255,136,0.1)',
                    border: '1px solid rgba(0,255,136,0.3)',
                    borderRadius: '2px',
                    padding: '2px 8px',
                    flexShrink: 0,
                    marginTop: '1px',
                  }}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{step}</span>
                </li>
              ))}
            </ol>
          </ResultCard>

        </div>
      </div>
    </div>
  )
}

/* ── Reusable Result Card ── */
function ResultCard({ title, accentColor, children, animationDelay }: any) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-dim)',
      borderTop: `2px solid ${accentColor}`,
      borderRadius: '2px',
      padding: '1.5rem',
      position: 'relative',
      boxShadow: `0 0 20px rgba(0,0,0,0.4), 0 0 1px ${accentColor}`,
      animation: `slide-in-up 0.4s ease ${animationDelay} both`,
      clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)',
    }}>
      {/* Corner accent */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: '12px', height: '12px',
        background: accentColor,
        clipPath: 'polygon(100% 0, 100% 100%, 0 0)',
        opacity: 0.8,
      }} />
      <h2 style={{
        fontFamily: 'var(--font-game)',
        fontSize: '0.75rem',
        letterSpacing: '0.12em',
        color: accentColor,
        margin: '0 0 1rem',
        textShadow: `0 0 10px ${accentColor}`,
      }}>
        {title}
      </h2>
      {children}
    </div>
  )
}