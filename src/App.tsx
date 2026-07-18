import newStadiumImage from '@/imports/Download_Football_stadium_inside_at_night_with_lights_Post-Production_for_free.jpg'
import { useState, useEffect, useCallback, useRef, type CSSProperties } from 'react'

// ── Types ──────────────────────────────────────────────────────
type View = 'landing' | 'dashboard' | 'ai' | 'map'
interface Message { id: number; role: 'user' | 'ai'; text: string; time: string }
interface Alert   { id: number; type: 'warning' | 'info' | 'success' | 'danger'; msg: string; time: string }

// ── Data ───────────────────────────────────────────────────────
const AI_RESPONSES = [
  "Crowd density in Sector C is at 82%. I recommend redirecting via Gate B2 — wait time is under 3 minutes. Shall I update digital signage?",
  "Based on current ingress rate, Concourse 4 food court will hit capacity in approximately 18 minutes. Pre-positioning 2 additional staff now.",
  "Match update: Minute 74, score ARG 2–BRA 1. Fan sentiment index 7.8/10. No security escalations detected.",
  "Metro Line 3 is operating at 94% capacity outbound. I've coordinated with transport authority to add 2 extra trains at 21:45 and 22:00.",
  "Medical team Alpha dispatched to Sector F, Row 22. ETA 90 seconds. Incident is minor and contained.",
  "Energy consumption is 14% below projection. Solar panels generating 34 kW. Water recycling at 91% efficiency.",
]

const INIT_MESSAGES: Message[] = [
  { id: 1, role: 'ai',   text: "Welcome to StadiumMind AI. I'm your intelligent stadium copilot for FIFA World Cup 2026. How can I assist you today?", time: '21:32' },
  { id: 2, role: 'user', text: "What's the current crowd density situation?", time: '21:33' },
  { id: 3, role: 'ai',   text: "Current attendance is 89,234 of 95,000 capacity (93.9%). All sectors within safe limits. Sector B is the densest at 97% — staff already rerouted. Gates 7 and 12 have minimal queues.", time: '21:33' },
]

const INIT_ALERTS: Alert[] = [
  { id: 1, type: 'warning', msg: 'Gate C2 queue exceeding 8-min threshold',         time: '21:47' },
  { id: 2, type: 'info',    msg: 'Medical team deployed to Sector F — minor incident', time: '21:44' },
  { id: 3, type: 'success', msg: 'Metro Line 2 flow normalized — extra train added',  time: '21:39' },
  { id: 4, type: 'danger',  msg: 'Unauthorized access at Service Gate 5 — resolved',  time: '21:28' },
]

const MAP_ZONES = [
  { id: 'A', label: 'Sector A — North Stand', fill: '#1F6FEB', crowd: 91, gates: ['Gate 1','Gate 2'] },
  { id: 'B', label: 'Sector B — East Stand',  fill: '#E34C4C', crowd: 97, gates: ['Gate 3','Gate 4','Gate 5'] },
  { id: 'C', label: 'Sector C — South Stand', fill: '#F5B942', crowd: 82, gates: ['Gate 6','Gate 7'] },
  { id: 'D', label: 'Sector D — West Stand',  fill: '#3DDC84', crowd: 78, gates: ['Gate 8','Gate 9','Gate 10'] },
  { id: 'E', label: 'Sector E — VIP East',    fill: '#00C2FF', crowd: 65, gates: ['Gate 11'] },
  { id: 'F', label: 'Sector F — VIP West',    fill: '#00C2FF', crowd: 70, gates: ['Gate 12'] },
]

const fmt = (n: number) => n.toLocaleString()
const pct = (v: number, total: number) => Math.round((v / total) * 100)
function densityColor(p: number) {
  if (p >= 95) return '#E34C4C'
  if (p >= 85) return '#F5B942'
  return '#3DDC84'
}

// ── Nav ────────────────────────────────────────────────────────
// ── Nav ────────────────────────────────────────────────────────
function Nav({
  view, setView, scrolled, setShowLogin, user, handleLogout
}: {
  view: View; setView: (v: View) => void; scrolled: boolean; setShowLogin: (v: boolean) => void; user: any; handleLogout: () => void
}) {
  const links: { label: string; v?: View }[] = [
    { label: 'Home',         v: 'landing'   },
    { label: 'Dashboard',    v: 'dashboard' },
    { label: 'AI Assistant', v: 'ai'        },
    { label: 'Stadium Map',  v: 'map'       },
  ]

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 clamp(20px,4vw,48px)',
      background: scrolled || view !== 'landing'
        ? 'rgba(7,17,28,0.88)'
        : 'transparent',
      borderBottom: scrolled || view !== 'landing'
        ? '1px solid rgba(255,255,255,0.06)'
        : '1px solid transparent',
      backdropFilter: scrolled || view !== 'landing' ? 'blur(20px)' : 'none',
      transition: 'background 0.35s, border-color 0.35s, backdrop-filter 0.35s',
    }}>
      {/* Logo */}
      <button
        onClick={() => setView('landing')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 9 }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: 'linear-gradient(135deg, #00C2FF, #1F6FEB)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, boxShadow: '0 2px 14px rgba(0,194,255,0.35)',
        }}>⚽</div>
        <span className="font-montserrat" style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px', color: '#fff' }}>
          StadiumMind <span style={{ color: '#00C2FF' }}>AI</span>
        </span>
      </button>

      {/* Center links */}
      <div style={{ display: 'flex', gap: 2 }}>
        {links.map(l => (
          <button
            key={l.label}
            onClick={() => l.v && setView(l.v)}
            style={{
              border: 'none', cursor: 'pointer',
              padding: '6px 14px', borderRadius: 8,
              fontSize: 13, fontWeight: 500,
              color: view === l.v ? '#ffffff' : 'rgba(200,210,224,0.65)',
              transition: 'color 0.18s, background 0.18s',
              background: view === l.v ? 'rgba(0,194,255,0.1)' : 'transparent',
            } as CSSProperties}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff' }}
            onMouseLeave={e => { if (view !== l.v) (e.currentTarget as HTMLElement).style.color = 'rgba(200,210,224,0.65)' }}
          >{l.label}</button>
        ))}
      </div>

      {/* CTA */}
      {user ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn-outline"
            onClick={handleLogout}
            style={{ padding: '8px 16px', borderRadius: 9, fontSize: 13 }}
          >
            Logout
          </button>
        </div>
      ) : (
        <button
          className="btn-primary"
          onClick={() => setShowLogin(true)}
          style={{ padding: '8px 20px', borderRadius: 9, fontSize: 13 }}
        >
          Launch Demo
        </button>
      )}
    </nav>
  )
}

// ── Floodlight Overlay ─────────────────────────────────────────
function FloodlightOverlay() {
  return (
    <>
      {/* Top ring glow — where the actual floodlights are in the image */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '55%',
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse 120% 60% at 50% -5%, rgba(160,210,255,0.13) 0%, transparent 65%)',
        animation: 'light-pulse 5s ease-in-out infinite',
      }} />
      {/* Individual floodlight cluster glows — top arc of stadium */}
      {[12, 28, 50, 72, 88].map((x, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${x}%`, top: '14%',
          width: 60, height: 60, borderRadius: '50%',
          transform: 'translate(-50%,-50%)',
          background: 'radial-gradient(circle, rgba(220,240,255,0.28) 0%, transparent 70%)',
          pointerEvents: 'none',
          animation: `flicker ${4 + i * 0.6}s ease-in-out ${i * 0.9}s infinite`,
        }} />
      ))}
    </>
  )
}

// ── Features Section ────────────────────────────────────────────
const FEATURES = [
  {
    icon: '👥',
    title: 'Crowd Intelligence',
    desc: 'Real-time density monitoring across all sectors with predictive routing to eliminate bottlenecks before they form.',
  },
  {
    icon: '🤖',
    title: 'AI Operations Copilot',
    desc: 'Natural language interface for instant decisions — from staff deployment to gate management to emergency response.',
  },
  {
    icon: '🚇',
    title: 'Transport Management',
    desc: 'Smart integration with metro, bus and parking systems. Proactive routing adjustments based on match events.',
  },
  {
    icon: '🚨',
    title: 'Emergency Response',
    desc: 'Automated incident detection, alert broadcasting and evacuation coordination across the entire venue.',
  },
  {
    icon: '♿',
    title: 'Accessibility Routing',
    desc: 'Barrier-free navigation for all fans. Real-time updates on accessible gates, elevators and priority seating.',
  },
  {
    icon: '🌿',
    title: 'Sustainability Dashboard',
    desc: 'Live energy, water and carbon monitoring against FIFA sustainability targets with automated reporting.',
  },
]

function FeaturesSection({ onEnter }: { onEnter: () => void }) {
  return (
    <section style={{ background: '#07111C', padding: 'clamp(72px,10vw,120px) clamp(20px,5vw,80px)' }}>
      {/* Label + heading */}
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '5px 14px', borderRadius: 100,
          border: '1px solid rgba(0,194,255,0.25)',
          background: 'rgba(0,194,255,0.06)',
          marginBottom: 22,
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, color: '#00C2FF' }}>CAPABILITIES</span>
        </div>
        <h2 className="font-montserrat" style={{
          fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 600,
          margin: '0 0 16px', letterSpacing: '-0.5px', color: '#fff',
          lineHeight: 1.15,
        }}>
          Everything your stadium needs,<br />
          <span className="text-gradient">intelligently integrated.</span>
        </h2>
        <p style={{
          fontSize: 15, color: '#6B7A93', maxWidth: 520,
          margin: '0 auto', lineHeight: 1.7,
        }}>
          One platform connecting operations, fan experience and safety — purpose-built for the world's largest sporting events.
        </p>
      </div>

      {/* Feature grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16, maxWidth: 1100, margin: '0 auto',
      }}>
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className="glass-card glass-card-hover"
            style={{
              borderRadius: 16, padding: '28px 28px 26px',
              animation: `card-enter 0.5s ease ${i * 0.07}s both`,
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 16 }}>{f.icon}</div>
            <h3 className="font-montserrat" style={{ fontSize: 16, fontWeight: 600, margin: '0 0 10px', color: '#fff' }}>{f.title}</h3>
            <p style={{ fontSize: 13.5, color: '#6B7A93', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Stats strip */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 'clamp(32px,6vw,80px)',
        flexWrap: 'wrap', marginTop: 80, paddingTop: 56,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        maxWidth: 900, margin: '80px auto 0',
      }}>
        {[
          { value: '95,000',  label: 'Fans per Match'       },
          { value: '<1s',     label: 'AI Response Time'     },
          { value: '32',      label: 'Languages Supported'  },
          { value: '99.9%',   label: 'System Uptime'        },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div className="font-montserrat" style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 700, color: '#fff', letterSpacing: '-1px' }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: '#6B7A93', fontWeight: 500, marginTop: 4, letterSpacing: 0.5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Final CTA */}
      <div style={{ textAlign: 'center', marginTop: 96 }}>
        <p className="font-montserrat" style={{ fontSize: 'clamp(20px,3vw,30px)', fontWeight: 600, color: '#fff', margin: '0 0 10px' }}>
          Ready to enter the command center?
        </p>
        <p style={{ fontSize: 14, color: '#6B7A93', margin: '0 0 32px' }}>
          Experience StadiumMind AI in a live match environment.
        </p>
        <button
          className="btn-primary"
          onClick={onEnter}
          style={{ padding: '14px 36px', borderRadius: 12, fontSize: 15 }}
        >
          Launch Demo →
        </button>
      </div>
    </section>
  )
}

// ── Landing View ───────────────────────────────────────────────
function LandingView({ onEnter, setView, user, setShowLogin }: { onEnter: () => void; setView: (v: View) => void; user: any; setShowLogin: (v: boolean) => void }) {
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 })
  const [isZooming, setIsZooming] = useState(false)

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
  }, [])

  const handleStadiumClick = () => {
    if (user) {
      setIsZooming(true)
      setTimeout(onEnter, 1100)
    } else {
      setShowLogin(true)
    }
  }

  // Very gentle parallax — max 10px at the edges
  const px = (mouse.x - 0.5) * 18
  const py = (mouse.y - 0.5) * 9

  return (
    <div style={{ background: '#07111C' }}>
      {/* ── Full-screen Hero ── */}
      <section
        onMouseMove={handleMouseMove}
        onClick={handleStadiumClick}
        style={{ position: 'relative', height: '100vh', overflow: 'hidden', cursor: 'default' }}
      >
        {/* Stadium Image */}
        <div style={{
          position: 'absolute', inset: '-4%',
          transition: isZooming ? undefined : 'transform 0.18s linear',
          transform: isZooming ? undefined : `translate(${px * 0.28}px, ${py * 0.18}px)`,
          animation: isZooming ? 'zoom-hero 1.1s ease-in forwards' : 'breathe 38s ease-in-out infinite',
          willChange: 'transform',
        }}>
          <img
            src={newStadiumImage}
            alt="FIFA World Cup 2026 stadium at night — floodlit pitch"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>

        {/* Overlay — very subtle: only bottom portion darkened for readability */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `
            linear-gradient(to top,
              rgba(7,17,28,0.88) 0%,
              rgba(7,17,28,0.48) 22%,
              rgba(7,17,28,0.12) 45%,
              transparent 65%
            ),
            linear-gradient(to bottom,
              rgba(7,17,28,0.28) 0%,
              transparent 15%
            )
          `,
        }} />

        {/* Floodlight animations */}
        <FloodlightOverlay />

        {/* Zoom fade */}
        {isZooming && (
          <div style={{
            position: 'absolute', inset: 0, background: '#07111C',
            animation: 'fade-to-black 1.1s ease forwards', pointerEvents: 'none',
          }} />
        )}

        {/* Hero text — bottom-center, content floats above gradient */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'flex-end',
          paddingBottom: 'clamp(60px,9vh,100px)',
          transform: `translate(${px * -0.1}px, ${py * -0.06}px)`,
          transition: 'transform 0.28s linear',
          pointerEvents: 'none',
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '5px 15px', borderRadius: 100,
            border: '1px solid rgba(0,194,255,0.28)',
            background: 'rgba(0,194,255,0.07)',
            backdropFilter: 'blur(10px)',
            marginBottom: 22,
            animation: 'slide-up 0.65s ease both',
          }}>
            <span className="live-dot" />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: '#C8D2E0' }}>
              FIFA WORLD CUP 2026 · AI OPERATIONS PLATFORM
            </span>
          </div>

          {/* Title */}
          <h1
            className="font-montserrat"
            style={{
              fontSize: 'clamp(36px, 5.2vw, 64px)',
              fontWeight: 600, letterSpacing: '-1.5px',
              lineHeight: 1.06, margin: '0 0 14px',
              textAlign: 'center',
              textShadow: '0 2px 24px rgba(0,0,0,0.55)',
              animation: 'slide-up 0.65s ease 0.08s both',
              color: '#ffffff',
            }}
          >
            StadiumMind AI
          </h1>

          {/* Subtitle */}
          <p
            className="font-montserrat"
            style={{
              fontSize: 'clamp(17px, 2.2vw, 24px)',
              fontWeight: 400, color: 'rgba(200,210,224,0.82)',
              margin: '0 0 18px', letterSpacing: '-0.2px',
              textAlign: 'center',
              animation: 'slide-up 0.65s ease 0.14s both',
            }}
          >
            The Intelligent Stadium Operations Copilot
          </p>

          {/* Description */}
          <p style={{
            fontSize: 14.5, color: 'rgba(200,210,224,0.58)',
            maxWidth: 500, lineHeight: 1.7, textAlign: 'center',
            margin: '0 0 36px',
            animation: 'slide-up 0.65s ease 0.2s both',
          }}>
            Enhancing fan experience, navigation, crowd intelligence, accessibility,
            transportation and real-time decision support through Generative AI.
          </p>

          {/* CTAs */}
          <div style={{
            display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center',
            pointerEvents: 'all',
            animation: 'slide-up 0.65s ease 0.27s both',
          }}>
            <button
              className="btn-primary"
              onClick={e => { e.stopPropagation(); handleStadiumClick() }}
              style={{ padding: '13px 30px', borderRadius: 10, fontSize: 14 }}
            >
              Launch Demo
            </button>
            <button
              className="btn-outline"
              onClick={e => { e.stopPropagation(); setView('dashboard') }}
              style={{ padding: '13px 30px', borderRadius: 10, fontSize: 14 }}
            >
              View Dashboard
            </button>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{
          position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          animation: 'slide-up 0.7s ease 0.45s both',
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: 10, letterSpacing: '0.16em', color: 'rgba(200,210,224,0.3)', fontWeight: 500 }}>
            SCROLL
          </span>
          <div style={{
            width: 1, height: 28,
            background: 'linear-gradient(to bottom, rgba(200,210,224,0.3), transparent)',
            animation: 'scroll-bounce 2s ease-in-out infinite',
          }} />
        </div>
      </section>

      {/* ── Features below fold ── */}
      <FeaturesSection onEnter={handleStadiumClick} />
    </div>
  )
}

// ── Mini Sparkline ─────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data); const min = Math.min(...data)
  const range = max - min || 1
  const w = 120; const h = 38
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`sg${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={`0,${h} ${pts.join(' ')} ${w},${h}`} fill={`url(#sg${color.replace('#','')})`} />
    </svg>
  )
}

// ── Crowd Heatmap ──────────────────────────────────────────────
function CrowdHeatmap({ activeZone, setActiveZone }: { activeZone: string | null; setActiveZone: (v: string | null) => void }) {
  return (
    <svg viewBox="0 0 300 200" style={{ width: '100%', height: 'auto', cursor: 'pointer' }}>
      <ellipse cx="150" cy="100" rx="130" ry="85" fill="#0C1826" stroke="rgba(0,194,255,0.15)" strokeWidth="1" />
      <ellipse cx="150" cy="100" rx="105" ry="68" fill="#0D2E12" />
      {[0,1,2,3].map(i => (
        <ellipse key={i} cx="150" cy="100" rx={22+i*22} ry={14+i*14} fill="none" stroke="rgba(61,220,132,0.07)" strokeWidth="1" />
      ))}
      <line x1="150" y1="32" x2="150" y2="168" stroke="rgba(61,220,132,0.2)" strokeWidth="0.8" />
      <circle cx="150" cy="100" r="18" fill="none" stroke="rgba(61,220,132,0.2)" strokeWidth="0.8" />
      <circle cx="150" cy="100" r="3" fill="rgba(61,220,132,0.7)" />

      {/* North */}
      <path d="M 38,30 A 120,90 0 0 1 262,30"
        fill={MAP_ZONES[0].fill + (activeZone==='A'?'77':'33')}
        stroke={MAP_ZONES[0].fill} strokeWidth="1.2"
        onClick={() => setActiveZone(activeZone==='A' ? null : 'A')} style={{ cursor:'pointer' }} />
      <text x="150" y="20" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="8.5" fontWeight="600">A · {MAP_ZONES[0].crowd}%</text>

      {/* East */}
      <path d="M 262,30 A 120,90 0 0 1 262,170"
        fill={MAP_ZONES[1].fill + (activeZone==='B'?'77':'33')}
        stroke={MAP_ZONES[1].fill} strokeWidth="1.2"
        onClick={() => setActiveZone(activeZone==='B' ? null : 'B')} style={{ cursor:'pointer' }} />
      <text x="277" y="103" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="8.5" fontWeight="600">B · {MAP_ZONES[1].crowd}%</text>

      {/* South */}
      <path d="M 262,170 A 120,90 0 0 1 38,170"
        fill={MAP_ZONES[2].fill + (activeZone==='C'?'77':'33')}
        stroke={MAP_ZONES[2].fill} strokeWidth="1.2"
        onClick={() => setActiveZone(activeZone==='C' ? null : 'C')} style={{ cursor:'pointer' }} />
      <text x="150" y="191" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="8.5" fontWeight="600">C · {MAP_ZONES[2].crowd}%</text>

      {/* West */}
      <path d="M 38,170 A 120,90 0 0 1 38,30"
        fill={MAP_ZONES[3].fill + (activeZone==='D'?'77':'33')}
        stroke={MAP_ZONES[3].fill} strokeWidth="1.2"
        onClick={() => setActiveZone(activeZone==='D' ? null : 'D')} style={{ cursor:'pointer' }} />
      <text x="20" y="103" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="8.5" fontWeight="600">D · {MAP_ZONES[3].crowd}%</text>

      <rect x="138" y="47" width="24" height="12" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
      <rect x="138" y="141" width="24" height="12" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
    </svg>
  )
}

// ── Dashboard Card ─────────────────────────────────────────────
function DCard({ children, style, delay = 0 }: { children: React.ReactNode; style?: CSSProperties; delay?: number }) {
  return (
    <div className="glass-card glass-card-hover" style={{
      borderRadius: 16, padding: '18px 20px',
      animation: `card-enter 0.5s ease ${delay}s both`,
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── Dashboard View ─────────────────────────────────────────────
function DashboardView({
  liveData, alerts, activeZone, setActiveZone, setView,
}: {
  liveData: { crowd: number; matchMin: number }; alerts: Alert[]
  activeZone: string | null; setActiveZone: (v: string | null) => void
  setView: (v: View) => void
}) {
  const crowdPct = pct(liveData.crowd, 95000)
  const crowdData = [78,81,84,86,87,89,91,90,92,91,93,94]
  const selected = MAP_ZONES.find(z => z.id === activeZone)

  return (
    <div style={{ minHeight: '100vh', paddingTop: 72 }}>
      {/* Stadium bg — very low opacity */}
      <div style={{ position: 'fixed', inset: 0, zIndex: -1 }}>
        <img src={newStadiumImage} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.07, filter:'blur(1px)' }} />
        <div style={{ position:'absolute', inset:0, background:'rgba(7,17,28,0.9)' }} />
      </div>

      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '24px 24px 40px' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontSize:11, color:'#6B7A93', letterSpacing:'0.14em', fontWeight:600, marginBottom:5 }}>
              FIFA WORLD CUP 2026 · MATCH DAY 18
            </div>
            <h2 className="font-montserrat" style={{ fontSize:24, fontWeight:600, margin:0, letterSpacing:'-0.4px' }}>
              Operations Command Center
            </h2>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn-outline" onClick={() => setView('ai')} style={{ padding:'8px 16px', borderRadius:9, fontSize:13 }}>
              🤖 AI Assistant
            </button>
            <button className="btn-outline" onClick={() => setView('map')} style={{ padding:'8px 16px', borderRadius:9, fontSize:13 }}>
              🗺 Stadium Map
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:14 }}>
          {[
            { icon:'👥', label:'Attendance',  value: fmt(liveData.crowd), sub:'/ 95,000', accent:'#00C2FF' },
            { icon:'⚽', label:'Match',       value:`ARG 2–1 BRA`,        sub:`${liveData.matchMin}' Live`, accent:'#F5B942' },
            { icon:'🤖', label:'AI Status',   value:'All Systems',         sub:'Online · 99.9%', accent:'#3DDC84' },
            { icon:'🚇', label:'Transport',   value:'Nominal',             sub:'Metro & Bus Clear', accent:'#00C2FF' },
            { icon:'⚡', label:'Energy',      value:'−14%',               sub:'Below projection', accent:'#3DDC84' },
          ].map((k, i) => (
            <DCard key={k.label} delay={i * 0.06} style={{ padding:'14px 16px' }}>
              <div style={{ fontSize:18, marginBottom:6 }}>{k.icon}</div>
              <div style={{ fontSize:10.5, color:'#6B7A93', letterSpacing:'0.04em', marginBottom:3 }}>{k.label}</div>
              <div className="font-montserrat" style={{ fontSize:16, fontWeight:700, color:k.accent }}>{k.value}</div>
              <div style={{ fontSize:10.5, color:'#6B7A93', marginTop:2 }}>{k.sub}</div>
            </DCard>
          ))}
        </div>

        {/* Main grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1.15fr 1fr', gap:10 }}>

          {/* Heatmap */}
          <DCard delay={0.1} style={{ gridRow:'span 2' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <span style={{ fontSize:13, fontWeight:600 }}>Live Crowd Heatmap</span>
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span className="live-dot" />
                <span style={{ fontSize:11, color:'#3DDC84' }}>Real-time</span>
              </div>
            </div>
            <CrowdHeatmap activeZone={activeZone} setActiveZone={setActiveZone} />
            {selected && (
              <div style={{
                marginTop:12, padding:'10px 13px', borderRadius:10,
                background:'rgba(0,194,255,0.07)', border:'1px solid rgba(0,194,255,0.18)',
              }}>
                <div style={{ fontSize:12, fontWeight:600, marginBottom:4 }}>{selected.label}</div>
                <div style={{ fontSize:11, color:'#C8D2E0' }}>
                  Density: <span style={{ color:densityColor(selected.crowd), fontWeight:700 }}>{selected.crowd}%</span>
                </div>
                <div style={{ fontSize:11, color:'#6B7A93', marginTop:3 }}>Gates: {selected.gates.join(' · ')}</div>
              </div>
            )}
            <div style={{ display:'flex', gap:10, marginTop:14, flexWrap:'wrap' }}>
              {[['#3DDC84','Low'],['#F5B942','Medium'],['#E34C4C','High']].map(([c,l]) => (
                <div key={l} style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <div style={{ width:7, height:7, borderRadius:2, background:c }} />
                  <span style={{ fontSize:10, color:'#6B7A93' }}>{l}</span>
                </div>
              ))}
            </div>
          </DCard>

          {/* Crowd trend */}
          <DCard delay={0.14}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:13, fontWeight:600 }}>Crowd Ingress</span>
              <span style={{ fontSize:11, color:'#6B7A93' }}>Last 2 hours</span>
            </div>
            <div style={{ marginBottom:8 }}>
              <span className="font-montserrat" style={{ fontSize:28, fontWeight:700, color:'#00C2FF' }}>{crowdPct}%</span>
              <span style={{ fontSize:12, color:'#6B7A93', marginLeft:6 }}>capacity</span>
            </div>
            <Sparkline data={crowdData} color="#00C2FF" />
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
              <span style={{ fontSize:10, color:'#6B7A93' }}>19:00</span>
              <span style={{ fontSize:10, color:'#6B7A93' }}>Now</span>
            </div>
          </DCard>

          {/* Queue prediction */}
          <DCard delay={0.17}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>Gate Queue Prediction</div>
            {[
              { gate:'Gate 1',  wait:2, p:18 },
              { gate:'Gate 3',  wait:4, p:38 },
              { gate:'Gate 7',  wait:8, p:72, warn:true },
              { gate:'Gate 11', wait:3, p:27 },
              { gate:'Gate 12', wait:1, p:8  },
            ].map(g => (
              <div key={g.gate} style={{ marginBottom:9 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:11, color:'#C8D2E0' }}>{g.gate}</span>
                  <span style={{ fontSize:11, color: g.warn ? '#F5B942' : '#6B7A93' }}>{g.wait} min</span>
                </div>
                <div style={{ height:4, borderRadius:2, background:'rgba(255,255,255,0.06)' }}>
                  <div style={{ height:'100%', width:`${g.p}%`, borderRadius:2, transition:'width 1s',
                    background: g.warn ? '#F5B942' : '#00C2FF', opacity: g.warn ? 1 : 0.75 }} />
                </div>
              </div>
            ))}
          </DCard>

          {/* AI Panel */}
          <DCard delay={0.2}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <span style={{ fontSize:13, fontWeight:600 }}>AI Operations</span>
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span className="live-dot" />
                <span style={{ fontSize:11, color:'#3DDC84' }}>Active</span>
              </div>
            </div>
            <p style={{ fontSize:12, color:'#C8D2E0', lineHeight:1.6, margin:'0 0 14px',
              padding:'12px', borderRadius:10,
              background:'rgba(0,194,255,0.06)', border:'1px solid rgba(0,194,255,0.14)',
            }}>
              Elevated density in Sector B detected. Fans rerouted via Gate 4 alternate corridor.
              Estimated resolution: 6 minutes.
            </p>
            {['Crowd Flow Analysis','Emergency Protocol','Transport Sync','Staff Deployment'].map((a, i) => (
              <div key={a} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize:11, color:'#C8D2E0' }}>{a}</span>
                <span style={{ fontSize:10, padding:'2px 8px', borderRadius:4, fontWeight:600,
                  background: i===1 ? 'rgba(227,76,76,0.12)' : 'rgba(61,220,132,0.1)',
                  color: i===1 ? '#E34C4C' : '#3DDC84',
                }}>
                  {i===1 ? 'STANDBY' : 'ACTIVE'}
                </span>
              </div>
            ))}
            <button className="btn-primary" onClick={() => setView('ai')}
              style={{ width:'100%', marginTop:14, padding:'9px', borderRadius:9, fontSize:13 }}>
              Open AI Assistant →
            </button>
          </DCard>

          {/* Alerts */}
          <DCard delay={0.22}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
              <span style={{ fontSize:13, fontWeight:600 }}>Alerts</span>
              <span style={{ fontSize:10, padding:'2px 8px', borderRadius:4,
                background:'rgba(245,185,66,0.12)', color:'#F5B942', fontWeight:700 }}>
                {alerts.filter(a => a.type!=='success').length} Active
              </span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              {alerts.map(a => {
                const c = { warning:'#F5B942', info:'#00C2FF', success:'#3DDC84', danger:'#E34C4C' }[a.type]
                return (
                  <div key={a.id} style={{
                    display:'flex', gap:9, alignItems:'flex-start',
                    padding:'9px 11px', borderRadius:9,
                    background:`rgba(${c==='#F5B942'?'245,185,66':c==='#E34C4C'?'227,76,76':c==='#3DDC84'?'61,220,132':'0,194,255'},0.06)`,
                    border:`1px solid rgba(${c==='#F5B942'?'245,185,66':c==='#E34C4C'?'227,76,76':c==='#3DDC84'?'61,220,132':'0,194,255'},0.18)`,
                  }}>
                    <span style={{ fontSize:13 }}>{a.type==='warning'?'⚠️':a.type==='danger'?'🚨':a.type==='success'?'✅':'ℹ️'}</span>
                    <div>
                      <div style={{ fontSize:11, color:'#fff', lineHeight:1.4 }}>{a.msg}</div>
                      <div style={{ fontSize:10, color:'#6B7A93', marginTop:2 }}>{a.time}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </DCard>

          {/* Transport */}
          <DCard delay={0.24}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Transport Intelligence</div>
            {[
              { name:'Metro Line 1', status:'Nominal',   p:68, c:'#3DDC84' },
              { name:'Metro Line 3', status:'High Load', p:94, c:'#E34C4C' },
              { name:'Bus Shuttle',  status:'Running',   p:55, c:'#3DDC84' },
              { name:'Parking P4',  status:'73% Full',  p:73, c:'#F5B942' },
            ].map(t => (
              <div key={t.name} style={{ marginBottom:9 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:11, color:'#C8D2E0' }}>{t.name}</span>
                  <span style={{ fontSize:10, color:t.c, fontWeight:600 }}>{t.status}</span>
                </div>
                <div style={{ height:3, borderRadius:2, background:'rgba(255,255,255,0.06)' }}>
                  <div style={{ height:'100%', width:`${t.p}%`, borderRadius:2, background:t.c, transition:'width 1s' }} />
                </div>
              </div>
            ))}
          </DCard>

          {/* Sustainability */}
          <DCard delay={0.26}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Sustainability</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:7, marginBottom:12 }}>
              {[
                { icon:'⚡', label:'Energy',  value:'−14%', color:'#3DDC84' },
                { icon:'💨', label:'CO₂',     value:'23t',  color:'#00C2FF' },
                { icon:'💧', label:'Water',   value:'94%',  color:'#1F6FEB' },
              ].map(m => (
                <div key={m.label} style={{ textAlign:'center', padding:'9px 6px', borderRadius:9,
                  background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize:16, marginBottom:4 }}>{m.icon}</div>
                  <div className="font-montserrat" style={{ fontSize:15, fontWeight:700, color:m.color }}>{m.value}</div>
                  <div style={{ fontSize:9.5, color:'#6B7A93', marginTop:2 }}>{m.label}</div>
                </div>
              ))}
            </div>
            <div style={{ padding:'9px 11px', borderRadius:9, fontSize:11,
              background:'rgba(61,220,132,0.06)', border:'1px solid rgba(61,220,132,0.18)',
              color:'#3DDC84', display:'flex', alignItems:'center', gap:6 }}>
              ✅ FIFA Platinum Sustainability · Target Exceeded
            </div>
          </DCard>

          {/* Staff */}
          <DCard delay={0.28}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Staff Management</div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
              {[['847','On Duty','#00C2FF'],['53','Stand-by','#3DDC84'],['12','Deployed','#F5B942']].map(([v,l,c]) => (
                <div key={l} style={{ textAlign:'center' }}>
                  <div className="font-montserrat" style={{ fontSize:22, fontWeight:700, color:c }}>{v}</div>
                  <div style={{ fontSize:10, color:'#6B7A93' }}>{l}</div>
                </div>
              ))}
            </div>
            {[
              { role:'Security',   count:240, total:280 },
              { role:'Medical',    count:48,  total:50  },
              { role:'Operations', count:320, total:340 },
              { role:'Volunteers', count:239, total:280 },
            ].map(s => (
              <div key={s.role} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
                <span style={{ fontSize:11, color:'#C8D2E0', width:80 }}>{s.role}</span>
                <div style={{ flex:1, height:3, borderRadius:2, background:'rgba(255,255,255,0.06)' }}>
                  <div style={{ height:'100%', borderRadius:2, background:'#1F6FEB',
                    width:`${(s.count/s.total)*100}%`, transition:'width 1s' }} />
                </div>
                <span style={{ fontSize:10, color:'#6B7A93', width:28, textAlign:'right' }}>{s.count}</span>
              </div>
            ))}
          </DCard>

        </div>
      </div>
    </div>
  )
}

// ── AI Assistant View ──────────────────────────────────────────
// ── AI Assistant View ──────────────────────────────────────────
function AIAssistantView({
  messages, setMessages, conversationId, setConversationId
}: {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  conversationId: string;
  setConversationId: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [lang, setLang] = useState('EN')
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const suggested = [
    "What's the current crowd density?",
    'Show emergency evacuation routes',
    'Transport status update',
    'Accessibility route to Sector A',
    'Food courts near Gate 7',
    'Medical team locations',
  ]

  const resetChat = () => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
    }
    const newId = Math.random().toString(36).substring(2, 15)
    sessionStorage.setItem('stadiummind_conv_id', newId)
    setConversationId(newId)
    setMessages([
      { id: 1, role: 'ai', text: "Chat history has been reset. How can I assist you in this new session today?", time: new Date().toLocaleTimeString('en', { hour:'2-digit', minute:'2-digit', hour12:false }) }
    ])
  }

  const send = async (text: string) => {
    if (!text.trim()) return
    const t = new Date().toLocaleTimeString('en', { hour:'2-digit', minute:'2-digit', hour12:false })
    
    // User message
    const userMsgId = Date.now()
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', text, time: t }])
    setInput('')
    setIsTyping(true)

    // Abort previous stream if active
    if (abortController) {
      abortController.abort()
    }
    const controller = new AbortController()
    setAbortController(controller)

    const aiMsgId = Date.now() + 1

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationId: conversationId,
          userId: 'demo-user'
        }),
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error('API server returned an error')
      }

      setIsTyping(false)
      // Append an empty AI message to stream content into
      setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', text: '', time: t }])

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('No readable response stream')

      let accumulated = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        accumulated += chunk
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: accumulated } : m))
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream generation aborted')
      } else {
        console.error('Fetch error:', err)
        setIsTyping(false)
        setMessages(prev => [...prev, {
          id: aiMsgId, role: 'ai',
          text: `⚠️ Error connecting to AI Assistant: ${err.message || 'Please check your connection and configuration.'}`,
          time: t
        }])
      }
    } finally {
      setAbortController(null)
    }
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages, isTyping])

  return (
    <div style={{ minHeight:'100vh', paddingTop:60 }}>
      <div style={{ position:'fixed', inset:0, zIndex:-1 }}>
        <img src={newStadiumImage} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.05, filter:'blur(4px)' }} />
        <div style={{ position:'absolute', inset:0, background:'rgba(7,17,28,0.93)' }} />
      </div>

      <div style={{ maxWidth:1080, margin:'0 auto', padding:'20px 20px 0', height:'calc(100vh - 60px)', display:'flex', gap:16 }}>
        {/* Chat pane */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12 }}>
          {/* Header */}
          <div className="glass-card" style={{ borderRadius:14, padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:38, height:38, borderRadius:11,
                background:'linear-gradient(135deg,#00C2FF,#1F6FEB)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🤖</div>
              <div>
                <div className="font-montserrat" style={{ fontWeight:600, fontSize:14 }}>StadiumMind AI</div>
                <div style={{ fontSize:11, color:'#3DDC84', display:'flex', alignItems:'center', gap:4 }}>
                  <span className="live-dot" style={{ width:5, height:5 } as CSSProperties} /> Online · &lt;1s response
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <button onClick={resetChat} style={{
                background: 'rgba(227,76,76,0.1)',
                border: '1px solid rgba(227,76,76,0.3)',
                color: '#E34C4C',
                borderRadius:6, padding:'4px 9px', fontSize:11, fontWeight:600, cursor:'pointer', transition:'all 0.18s',
                marginRight: 8
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(227,76,76,0.2)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(227,76,76,0.1)' }}
              >🔄 Reset</button>
              {['EN','ES','AR','PT','FR'].map(l => (
                <button key={l} onClick={() => setLang(l)} style={{
                  background: lang===l ? 'rgba(0,194,255,0.2)' : 'rgba(255,255,255,0.05)',
                  border: lang===l ? '1px solid rgba(0,194,255,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  color: lang===l ? '#fff' : '#6B7A93',
                  borderRadius:6, padding:'4px 9px', fontSize:11, fontWeight:600, cursor:'pointer', transition:'all 0.18s',
                }}>{l}</button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="scrollbar-thin" style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:10 }}>
            {messages.map(m => (
              <div key={m.id} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start', animation:'slide-up 0.25s ease' }}>
                {m.role==='ai' && (
                  <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,#00C2FF,#1F6FEB)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, marginRight:7, flexShrink:0, marginTop:2 }}>🤖</div>
                )}
                <div style={{
                  maxWidth:'70%', padding:'11px 14px',
                  borderRadius: m.role==='user' ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                  background: m.role==='user' ? 'linear-gradient(135deg,#1F6FEB,#0E4EC0)' : 'rgba(255,255,255,0.05)',
                  border: m.role==='ai' ? '1px solid rgba(255,255,255,0.07)' : 'none',
                  fontSize:13, lineHeight:1.55, color:'#fff',
                }}>
                  {m.text}
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:5, textAlign:'right' }}>{m.time}</div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,#00C2FF,#1F6FEB)',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>🤖</div>
                <div className="glass-card" style={{ padding:'10px 14px', borderRadius:'14px 14px 14px 3px', display:'flex', gap:5, alignItems:'center' }}>
                  {[0,1,2].map(i=>(
                    <div key={i} style={{ width:5, height:5, borderRadius:'50%', background:'#00C2FF',
                      animation:`data-pulse 1.1s ease ${i*0.18}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="glass-card" style={{ borderRadius:14, padding:'10px 14px', display:'flex', gap:8, alignItems:'flex-end', marginBottom:16 }}>
            <textarea
              className="input-glass"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); send(input) }}}
              placeholder="Ask about crowd flow, navigation, emergencies, sustainability..."
              rows={2}
              style={{ flex:1, resize:'none', borderRadius:9, padding:'9px 13px', fontSize:13, lineHeight:1.5 }}
            />
            <div style={{ display:'flex', gap:7 }}>
              <button style={{ width:38, height:38, borderRadius:9, border:'1px solid rgba(255,255,255,0.09)',
                background:'rgba(255,255,255,0.04)', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>🎤</button>
              <button 
                className={abortController ? "btn-outline" : "btn-primary"} 
                onClick={() => {
                  if (abortController) {
                    abortController.abort()
                  } else {
                    send(input)
                  }
                }}
                style={{ width:38, height:38, borderRadius:9, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}
              >
                {abortController ? '⏹' : '↑'}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ width:248, display:'flex', flexDirection:'column', gap:12 }}>
          <div className="glass-card" style={{ borderRadius:14, padding:16 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', color:'#6B7A93', marginBottom:11 }}>SUGGESTED</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {suggested.map(s => (
                <button key={s} onClick={() => send(s)} style={{
                  background:'rgba(0,194,255,0.06)', border:'1px solid rgba(0,194,255,0.15)',
                  borderRadius:9, padding:'9px 11px', textAlign:'left', cursor:'pointer',
                  fontSize:12, color:'#C8D2E0', lineHeight:1.4, transition:'all 0.18s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(0,194,255,0.14)'; (e.currentTarget as HTMLElement).style.color='#fff' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='rgba(0,194,255,0.06)'; (e.currentTarget as HTMLElement).style.color='#C8D2E0' }}
                >{s}</button>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ borderRadius:14, padding:16 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', color:'#6B7A93', marginBottom:11 }}>CAPABILITIES</div>
            {['🗺 Navigation Guidance','👥 Crowd Intelligence','🌍 32 Languages','♿ Accessibility','🚑 Emergency','🚇 Transport','🍔 Food & Merch','📊 Live Analytics'].map(c => (
              <div key={c} style={{ fontSize:11, color:'#C8D2E0', padding:'5px 0',
                borderBottom:'1px solid rgba(255,255,255,0.05)' }}>{c}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Stadium Map View ────────────────────────────────────────────
function StadiumMapView({ activeZone, setActiveZone }: { activeZone: string | null; setActiveZone: (v: string | null) => void }) {
  const [cat, setCat] = useState<string|null>(null)
  const selected = MAP_ZONES.find(z => z.id === activeZone)

  const pois = [
    { type:'gate',    icon:'🚪', label:'Gate 1',  x:50, y:8  },
    { type:'gate',    icon:'🚪', label:'Gate 3',  x:88, y:30 },
    { type:'gate',    icon:'🚪', label:'Gate 7',  x:50, y:92 },
    { type:'gate',    icon:'🚪', label:'Gate 9',  x:12, y:30 },
    { type:'food',    icon:'🍔', label:'Food A',  x:30, y:22 },
    { type:'food',    icon:'🍔', label:'Food B',  x:70, y:22 },
    { type:'medical', icon:'🏥', label:'Medical', x:50, y:50 },
    { type:'parking', icon:'🚗', label:'P1',      x:5,  y:50 },
    { type:'access',  icon:'♿', label:'Access',  x:20, y:50 },
    { type:'merch',   icon:'👕', label:'Merch',   x:80, y:50 },
  ]

  return (
    <div style={{ minHeight:'100vh', paddingTop:60 }}>
      <div style={{ position:'fixed', inset:0, zIndex:-1 }}>
        <img src={newStadiumImage} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.05, filter:'blur(3px)' }} />
        <div style={{ position:'absolute', inset:0, background:'rgba(7,17,28,0.92)' }} />
      </div>

      <div style={{ maxWidth:1180, margin:'0 auto', padding:'20px', display:'flex', gap:16 }}>
        {/* Map */}
        <div className="glass-card" style={{ flex:1, borderRadius:18, padding:22 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <div>
              <div style={{ fontSize:10, color:'#6B7A93', letterSpacing:'0.12em', marginBottom:4 }}>INTERACTIVE STADIUM MAP</div>
              <h3 className="font-montserrat" style={{ margin:0, fontSize:18, fontWeight:600 }}>
                Lusail Iconic Stadium <span style={{ color:'#00C2FF' }}>·</span> Qatar
              </h3>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              {['gate','food','medical','parking','access'].map(c => (
                <button key={c} onClick={() => setCat(cat===c ? null : c)} style={{
                  padding:'4px 11px', borderRadius:7, fontSize:11, fontWeight:600, cursor:'pointer',
                  border:'1px solid rgba(255,255,255,0.08)',
                  background: cat===c ? 'rgba(0,194,255,0.18)' : 'rgba(255,255,255,0.04)',
                  color: cat===c ? '#fff' : '#6B7A93', transition:'all 0.18s', textTransform:'capitalize',
                }}>{c}</button>
              ))}
            </div>
          </div>

          <div style={{ position:'relative', width:'100%', paddingBottom:'62%' }}>
            <div style={{ position:'absolute', inset:0 }}>
              <svg viewBox="0 0 400 260" style={{ width:'100%', height:'100%' }}>
                <ellipse cx="200" cy="130" rx="195" ry="125" fill="#0B1624" stroke="rgba(0,194,255,0.15)" strokeWidth="1.5"/>
                {MAP_ZONES.slice(0,4).map((z) => {
                  const paths: Record<string,string> = {
                    A:"M 60,35 A 195,125 0 0 1 340,35",
                    B:"M 340,35 A 195,125 0 0 1 340,225",
                    C:"M 340,225 A 195,125 0 0 1 60,225",
                    D:"M 60,225 A 195,125 0 0 1 60,35",
                  }
                  return (
                    <path key={z.id} d={paths[z.id]}
                      fill={z.fill + (activeZone===z.id ? '66':'22')}
                      stroke={z.fill + (activeZone===z.id ? 'cc':'55')} strokeWidth="1.5"
                      style={{ cursor:'pointer', transition:'all 0.2s' }}
                      onClick={() => setActiveZone(activeZone===z.id ? null : z.id)} />
                  )
                })}
                <ellipse cx="200" cy="130" rx="130" ry="85" fill="#0D2E12" stroke="rgba(61,220,132,0.25)" strokeWidth="1.2"/>
                <ellipse cx="200" cy="130" rx="105" ry="68" fill="#0F3A0B"/>
                {[0,1,2].map(i=><ellipse key={i} cx="200" cy="130" rx={30+i*28} ry={20+i*18} fill="none" stroke="rgba(61,220,132,0.08)" strokeWidth="0.8"/>)}
                <line x1="200" y1="45" x2="200" y2="215" stroke="rgba(61,220,132,0.25)" strokeWidth="0.8"/>
                <circle cx="200" cy="130" r="22" fill="none" stroke="rgba(61,220,132,0.25)" strokeWidth="0.8"/>
                <circle cx="200" cy="130" r="4" fill="rgba(61,220,132,0.8)"/>
                <rect x="182" y="62" width="36" height="16" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8"/>
                <rect x="182" y="182" width="36" height="16" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8"/>
                <text x="200" y="19"  textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="10" fontWeight="600">A</text>
                <text x="375" y="134" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="10" fontWeight="600">B</text>
                <text x="200" y="252" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="10" fontWeight="600">C</text>
                <text x="22"  y="134" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="10" fontWeight="600">D</text>
                {pois.filter(p => !cat || p.type===cat).map(p => {
                  const px2 = (p.x/100)*400; const py2 = (p.y/100)*260
                  return (
                    <g key={p.label} style={{ cursor:'pointer' }}>
                      <circle cx={px2} cy={py2} r="13" fill="rgba(7,17,28,0.85)" stroke="rgba(0,194,255,0.4)" strokeWidth="1"/>
                      <text x={px2} y={py2+5} textAnchor="middle" fontSize="11">{p.icon}</text>
                      <text x={px2} y={py2+23} textAnchor="middle" fontSize="7.5" fill="rgba(255,255,255,0.5)">{p.label}</text>
                    </g>
                  )
                })}
                {activeZone && (
                  <line x1="200" y1="130" x2="200" y2="19"
                    stroke="#00C2FF" strokeWidth="1.5" strokeDasharray="5,4" opacity="0.6"
                    style={{ animation:'data-pulse 1.8s ease-in-out infinite' }} />
                )}
              </svg>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ width:268, display:'flex', flexDirection:'column', gap:12 }}>
          {selected && (
            <div className="glass-card" style={{ borderRadius:14, padding:16, animation:'modal-pop 0.25s ease', border:`1px solid ${selected.fill}33` }}>
              <div style={{ fontSize:12, fontWeight:600, color:selected.fill, marginBottom:6 }}>{selected.label}</div>
              <div className="font-montserrat" style={{ fontSize:26, fontWeight:700 }}>
                <span style={{ color:densityColor(selected.crowd) }}>{selected.crowd}%</span>
                <span style={{ fontSize:12, color:'#6B7A93', fontWeight:400 }}> capacity</span>
              </div>
              <div style={{ fontSize:11, color:'#C8D2E0', margin:'10px 0 4px' }}>Active Gates</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:14 }}>
                {selected.gates.map(g => (
                  <span key={g} style={{ fontSize:11, padding:'3px 9px', borderRadius:6,
                    background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)', color:'#fff' }}>{g}</span>
                ))}
              </div>
              <button className="btn-primary" style={{ width:'100%', padding:'9px', borderRadius:9, fontSize:12 }}>
                Get Directions
              </button>
            </div>
          )}

          <div className="glass-card" style={{ borderRadius:14, padding:16 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', color:'#6B7A93', marginBottom:11 }}>ALL SECTORS</div>
            {MAP_ZONES.map(z => (
              <div key={z.id} onClick={() => setActiveZone(activeZone===z.id ? null : z.id)} style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'7px 9px', borderRadius:9, cursor:'pointer', marginBottom:3,
                background: activeZone===z.id ? `${z.fill}12` : 'transparent',
                border: activeZone===z.id ? `1px solid ${z.fill}33` : '1px solid transparent',
                transition:'all 0.18s',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <div style={{ width:7, height:7, borderRadius:2, background:z.fill }} />
                  <span style={{ fontSize:11.5 }}>{z.label}</span>
                </div>
                <span style={{ fontSize:11, fontWeight:700, color:densityColor(z.crowd) }}>{z.crowd}%</span>
              </div>
            ))}
          </div>

          <div className="glass-card" style={{ borderRadius:14, padding:16 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', color:'#6B7A93', marginBottom:11 }}>QUICK INFO</div>
            {[
              { icon:'🚪', label:'Open Gates',  value:'12 / 14' },
              { icon:'🅿',  label:'Parking',     value:'73% Full' },
              { icon:'🍔', label:'Food Courts', value:'8 Open' },
              { icon:'🏥', label:'Medical',     value:'4 Stations' },
              { icon:'♿', label:'Accessible',  value:'All Routes' },
            ].map(q => (
              <div key={q.label} style={{ display:'flex', justifyContent:'space-between',
                padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:11.5 }}>
                <span style={{ color:'#6B7A93' }}>{q.icon} {q.label}</span>
                <span style={{ color:'#fff', fontWeight:500 }}>{q.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Login Modal ─────────────────────────────────────────────────
function LoginModal({ onClose, onLoginSuccess }: { onClose: () => void; onLoginSuccess: (user: any) => void }) {
  const [email, setEmail]       = useState('demo@example.com')
  const [password, setPassword] = useState('Demo@123')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const strength = password.length > 10 ? 3 : password.length > 6 ? 2 : password.length > 2 ? 1 : 0
  const strengthColor = ['','#E34C4C','#F5B942','#3DDC84'][strength]
  const strengthLabel = ['','Weak','Fair','Strong'][strength]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        const data = await res.json()
        onLoginSuccess(data.user)
        onClose()
      } else {
        const err = await res.json()
        setErrorMsg(err.detail || 'Invalid email or password.')
      }
    } catch (err) {
      setErrorMsg('Network error. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200,
      display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(7,17,28,0.82)', backdropFilter:'blur(16px)' }}
      onClick={onClose}
    >
      <div className="glass-card" onClick={e => e.stopPropagation()} style={{
        borderRadius:20, padding:'36px 36px 28px', width:400, maxWidth:'92vw',
        border:'1px solid rgba(255,255,255,0.09)',
        boxShadow:'0 30px 80px rgba(0,0,0,0.65)',
        animation:'modal-pop 0.35s ease',
      }}>
        <form onSubmit={handleLogin}>
          {/* Header */}
          <div style={{ textAlign:'center', marginBottom:26 }}>
            <div style={{ width:48, height:48, borderRadius:13, margin:'0 auto 12px',
              background:'linear-gradient(135deg,#00C2FF,#1F6FEB)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:24,
              boxShadow:'0 4px 20px rgba(0,194,255,0.35)' }}>⚽</div>
            <h2 className="font-montserrat" style={{ margin:'0 0 4px', fontSize:20, fontWeight:600 }}>StadiumMind AI</h2>
            <p style={{ margin:0, fontSize:12, color:'#6B7A93' }}>FIFA World Cup 2026 · Operations Platform</p>
          </div>

          {/* Email */}
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:12, color:'#C8D2E0', fontWeight:500, display:'block', marginBottom:5 }}>Email</label>
            <input className="input-glass" type="email" value={email} onChange={e=>setEmail(e.target.value)}
              style={{ width:'100%', borderRadius:10, padding:'11px 14px', fontSize:13 }} required />
          </div>

          {/* Password */}
          <div style={{ marginBottom:6 }}>
            <label style={{ fontSize:12, color:'#C8D2E0', fontWeight:500, display:'block', marginBottom:5 }}>Password</label>
            <div style={{ position:'relative' }}>
              <input className="input-glass" type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)}
                style={{ width:'100%', borderRadius:10, padding:'11px 40px 11px 14px', fontSize:13 }} required />
              <button type="button" onClick={()=>setShowPass(!showPass)} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)',
                background:'none', border:'none', cursor:'pointer', fontSize:15, color:'#6B7A93' }}>
                {showPass?'🙈':'👁'}
              </button>
            </div>
          </div>

          {/* Strength */}
          {password && (
            <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:14 }}>
              {[1,2,3].map(i=>(
                <div key={i} style={{ flex:1, height:3, borderRadius:2,
                  background: i<=strength ? strengthColor : 'rgba(255,255,255,0.08)', transition:'background 0.3s' }} />
              ))}
              {strength>0 && <span style={{ fontSize:10, color:strengthColor, marginLeft:2 }}>{strengthLabel}</span>}
            </div>
          )}

          {/* Options */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <label style={{ display:'flex', alignItems:'center', gap:7, cursor:'pointer', fontSize:12, color:'#C8D2E0' }}>
              <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} style={{ accentColor:'#00C2FF' }} />
              Remember me
            </label>
            <button type="button" style={{ background:'none', border:'none', color:'#00C2FF', cursor:'pointer', fontSize:12, fontWeight:500 }}>
              Forgot password?
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div style={{ color: '#E34C4C', fontSize: 12, marginBottom: 14, textAlign: 'center', fontWeight: 500 }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={loading}
            style={{ width:'100%', padding:'13px', borderRadius:11, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {loading ? (
              <><div style={{ width:15, height:15, border:'2px solid rgba(7,17,28,0.4)',
                borderTopColor:'#07111C', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />Authenticating...</>
            ) : 'Enter Command Center'}
          </button>
          <button type="button" className="btn-outline" onClick={onClose} style={{ width:'100%', padding:'11px', borderRadius:11, fontSize:13, marginTop:8 }}>
            Cancel
          </button>
          <p style={{ textAlign:'center', fontSize:11, color:'#6B7A93', margin:'14px 0 0' }}>
            Demo credentials pre-filled
          </p>
        </form>
      </div>
    </div>
  )
}

// ── Main App ────────────────────────────────────────────────────
export default function App() {
  const [view, setView]           = useState<View>('landing')
  const [showLogin, setShowLogin] = useState(false)
  const [scrolled, setScrolled]   = useState(false)
  const [activeZone, setActiveZone] = useState<string | null>(null)
  const [messages, setMessages]   = useState<Message[]>(INIT_MESSAGES)
  const [alerts]                  = useState<Alert[]>(INIT_ALERTS)
  const [liveData, setLiveData]   = useState({ crowd: 89234, matchMin: 72 })

  const [user, setUser] = useState<{ id: number; email: string } | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [conversationId, setConversationId] = useState<string>(() => {
    let id = sessionStorage.getItem('stadiummind_conv_id')
    if (!id) {
      id = Math.random().toString(36).substring(2, 15)
      sessionStorage.setItem('stadiummind_conv_id', id)
    }
    return id
  })

  // Check authentication session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        } else {
          setUser(null)
        }
      } catch (err) {
        console.error("Auth check error", err)
        setUser(null)
      } finally {
        setAuthLoading(false)
      }
    }
    checkAuth()
  }, [])

  // Sync navigation view with browser pathname
  const navigateTo = (targetView: View) => {
    if (targetView === 'landing') {
      setView('landing')
      window.history.pushState(null, '', '/')
      return
    }

    if (!user && !authLoading) {
      setView('landing')
      window.history.pushState(null, '', '/')
      setShowLogin(true)
      return
    }

    setView(targetView)
    const paths: Record<Exclude<View, 'landing'>, string> = {
      dashboard: '/dashboard',
      ai: '/assistant',
      map: '/stadium-map'
    }
    window.history.pushState(null, '', paths[targetView])
  }

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      let targetView: View = 'landing'
      if (path === '/dashboard') targetView = 'dashboard'
      else if (path === '/assistant') targetView = 'ai'
      else if (path === '/stadium-map') targetView = 'map'

      if (targetView !== 'landing' && !user && !authLoading) {
        window.history.replaceState(null, '', '/')
        setView('landing')
        setShowLogin(true)
      } else {
        setView(targetView)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [user, authLoading])

  // Initial load route guard
  useEffect(() => {
    if (authLoading) return

    const path = window.location.pathname
    if (path === '/dashboard' || path === '/assistant' || path === '/stadium-map') {
      if (user) {
        const viewMap: Record<string, View> = {
          '/dashboard': 'dashboard',
          '/assistant': 'ai',
          '/stadium-map': 'map'
        }
        setView(viewMap[path])
      } else {
        window.history.replaceState(null, '', '/')
        setView('landing')
        setShowLogin(true)
      }
    } else {
      setView('landing')
    }
  }, [authLoading, user])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      console.error("Logout failed", e)
    }
    setUser(null)
    navigateTo('landing')
  }

  const handleLoginSuccess = (loggedInUser: { id: number; email: string }) => {
    setUser(loggedInUser)
    setView('dashboard')
    window.history.pushState(null, '', '/dashboard')
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setLiveData(prev => ({
        crowd: Math.min(95000, Math.max(82000, prev.crowd + Math.floor((Math.random()-0.3)*80))),
        matchMin: Math.min(90, prev.matchMin + 1),
      }))
    }, 9000)
    return () => clearInterval(id)
  }, [])

  const handleEnter = useCallback(() => {
    navigateTo('dashboard')
  }, [user])

  return (
    <div style={{ minHeight:'100vh', background:'#07111C', color:'#fff' }}>
      <Nav view={view} setView={navigateTo} scrolled={scrolled} setShowLogin={setShowLogin} user={user} handleLogout={handleLogout} />

      {view === 'landing' && (
        <LandingView onEnter={handleEnter} setView={navigateTo} user={user} setShowLogin={setShowLogin} />
      )}
      {view === 'dashboard' && (
        <DashboardView liveData={liveData} alerts={alerts} activeZone={activeZone} setActiveZone={setActiveZone} setView={navigateTo} />
      )}
      {view === 'ai' && (
        <AIAssistantView messages={messages} setMessages={setMessages} conversationId={conversationId} setConversationId={setConversationId} />
      )}
      {view === 'map' && (
        <StadiumMapView activeZone={activeZone} setActiveZone={setActiveZone} />
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLoginSuccess={handleLoginSuccess} />}
    </div>
  )
}
