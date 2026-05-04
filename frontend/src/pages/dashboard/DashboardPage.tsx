import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScoreRing }  from '../../components/score/ScoreRing'
import { GradeBadge } from '../../components/score/GradeBadge'
import { MetricBar }  from '../../components/score/MetricBar'
import type { Score } from '../../types/index'

// ─── SME Generator ────────────────────────────────────────────────────────────

type SMEType = 'low' | 'inconsistent' | 'growing' | 'strong'


function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

interface BaseValues {
  profileComplete: number
  postFreq:        number
  engagement:      number
  responsiveness:  number
  platformScore:   number
}

function generateBase(type: SMEType): BaseValues {
  switch (type) {
    case 'low':
      return {
        profileComplete: rand(40, 65),
        postFreq:        rand(10, 35),
        engagement:      rand(20, 45),
        responsiveness:  rand(40, 70),
        platformScore:   rand(10, 30),
      }
    case 'inconsistent':
      return {
        profileComplete: rand(60, 85),
        postFreq:        rand(30, 60),
        engagement:      rand(50, 80),
        responsiveness:  rand(20, 50),
        platformScore:   rand(40, 70),
      }
    case 'growing':
      return {
        profileComplete: rand(70, 90),
        postFreq:        rand(50, 75),
        engagement:      rand(60, 85),
        responsiveness:  rand(50, 75),
        platformScore:   rand(50, 80),
      }
    case 'strong':
      return {
        profileComplete: rand(85, 100),
        postFreq:        rand(70, 95),
        engagement:      rand(70, 95),
        responsiveness:  rand(70, 95),
        platformScore:   rand(70, 100),
      }
  }
}

function applyCorrections(data: BaseValues): BaseValues {
  let { postFreq, engagement, responsiveness, platformScore } = data

  // Low posting can't produce high engagement
  if (postFreq < 30 && engagement > 60)
    engagement = rand(30, 55)

  // High posting should lift engagement
  if (postFreq > 70 && engagement < 50)
    engagement = rand(55, 85)

  // Few platforms caps how much engagement is possible
  if (platformScore < 30 && engagement > 70)
    engagement = rand(40, 65)

  // Ignoring messages + high engagement is contradictory
  if (responsiveness < 30 && engagement > 70)
    engagement = rand(40, 62)

  // Very low posting → responsiveness shouldn't be sky-high
  if (postFreq < 20 && responsiveness > 80)
    responsiveness = rand(40, 70)

  // Strong posters must maintain at least decent responsiveness
  if (postFreq > 80)
    responsiveness = Math.max(responsiveness, 60)

  return { ...data, engagement, responsiveness }
}

function toPlatformArray(platformScore: number): string[] {
  // Each platform unlocks at a progressively higher threshold
  const thresholds: [string, number][] = [
    ['Facebook',         20],
    ['WhatsApp',         30],
    ['Instagram',        45],
    ['Google Business',  55],
    ['TikTok',           65],
    ['LinkedIn',         75],
    ['X',                85],
  ]
  return thresholds
    .filter(([, threshold]) => platformScore >= threshold)
    .map(([name]) => name)
}

function calcScore(v: BaseValues): number {
  return Math.round(
    v.profileComplete * 0.20 +
    v.postFreq        * 0.20 +
    v.engagement      * 0.25 +
    v.responsiveness  * 0.20 +
    v.platformScore   * 0.15,
  )
}

function calcGrade(score: number): Score['grade'] {
  if (score >= 80) return 'A'
  if (score >= 65) return 'B'
  if (score >= 50) return 'C'
  if (score >= 35) return 'D'
  return 'F'
}

function generateSME(type: SMEType | 'random'): Score {
  const SME_TYPES: SMEType[] = ['low', 'inconsistent', 'growing', 'strong']
  const resolved: SMEType = type === 'random'
    ? SME_TYPES[rand(0, SME_TYPES.length - 1)]
    : type

  const base      = generateBase(resolved)
  const corrected = applyCorrections(base)
  const score     = calcScore(corrected)
  const platforms = toPlatformArray(corrected.platformScore)

  return {
    id:              String(Date.now()),
    score,
    grade:           calcGrade(score),
    profileComplete: corrected.profileComplete,
    postFreq:        corrected.postFreq,
    engagement:      corrected.engagement,
    responsiveness:  corrected.responsiveness,
    platformCount:   platforms.length,
    platforms,
    dataSource:      'hybrid',
    calculatedAt:    new Date().toISOString(),
  }
}

// ─── FAB button config ────────────────────────────────────────────────────────

const FAB_BUTTONS: {
  type:  SMEType | 'random'
  label: string
  style: string
}[] = [
  { type: 'low',          label: '📉 Low SME',         style: 'bg-rose-50   text-rose-700   border-rose-200   hover:bg-rose-100'   },
  { type: 'inconsistent', label: '🌀 Inconsistent SME', style: 'bg-amber-50  text-amber-700  border-amber-200  hover:bg-amber-100'  },
  { type: 'growing',      label: '📈 Growing SME',      style: 'bg-blue-50   text-blue-700   border-blue-200   hover:bg-blue-100'   },
  { type: 'strong',       label: '🚀 Strong SME',       style: 'bg-teal-50   text-teal-700   border-teal-200   hover:bg-teal-100'   },
  { type: 'random',       label: '🎲 Random',           style: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { t } = useTranslation()
  const [s, setS]           = useState<Score>(generateSME('growing'))
  const [fabOpen, setFabOpen] = useState(false)
  const [smeLabel, setSmeLabel] = useState<string | null>(null)

  function simulate(type: SMEType | 'random', label: string) {
    setS(generateSME(type))
    setSmeLabel(label)
    setFabOpen(false)
  }

  return (
    <div className='p-6 max-w-2xl mx-auto'>

      {/* Score hero card */}
      <div className='bg-white rounded-2xl border border-slate-200 p-8 mb-6
                      flex flex-col items-center text-center'>
        <p className='text-sm text-slate-500 mb-4'>{t('dashboard.yourScore')}</p>

        <ScoreRing score={s.score} grade={s.grade} />

        <div className='mt-4'>
          <GradeBadge grade={s.grade} />
        </div>

        <p className='text-xs text-slate-400 mt-3'>
          {t('dashboard.lastUpdated')}: {new Date(s.calculatedAt).toLocaleDateString()}
        </p>

        {/* Simulated-type badge */}
        {smeLabel && (
          <span className='mt-2 text-xs bg-indigo-50 text-indigo-600
                           border border-indigo-200 px-3 py-1 rounded-full'>
            ⚡ Simulated: {smeLabel}
          </span>
        )}

        {/* Auto-fill badge */}
        {s.dataSource !== 'manual' && (
          <span className='mt-2 text-xs bg-teal-50 text-teal-600
                           border border-teal-200 px-3 py-1 rounded-full'>
            ✓ {t('dashboard.autoFill')}
          </span>
        )}
      </div>

      {/* Platforms used */}
      <div className='bg-white rounded-2xl border border-slate-200 p-6 mb-6'>
        <p className='text-sm text-slate-500 mb-3'>Connected platforms</p>
        <div className='flex gap-2 flex-wrap'>
          {s.platforms.length === 0
            ? <span className='text-xs text-slate-400 italic'>No platforms connected</span>
            : s.platforms.map(pl => (
                <span key={pl}
                  className='text-xs bg-indigo-50 text-indigo-600
                             border border-indigo-200 px-3 py-1 rounded-full font-medium'>
                  {pl}
                </span>
              ))
          }
        </div>
      </div>

      {/* Score breakdown */}
      <div className='bg-white rounded-2xl border border-slate-200 p-6 mb-6'>
        <h3 className='font-bold text-slate-800 mb-5'>
          {t('dashboard.scoreBreakdown')}
        </h3>
        <MetricBar
          label={t('dashboard.profileComplete')}
          value={s.profileComplete}
          weight={0.20}
          color='bg-teal-500'
        />
        <MetricBar
          label={t('dashboard.postFreq')}
          value={s.postFreq}
          weight={0.20}
          color='bg-indigo-500'
        />
        <MetricBar
          label={t('dashboard.engagement')}
          value={s.engagement}
          weight={0.25}
          color='bg-purple-500'
        />
        <MetricBar
          label={t('dashboard.responsiveness')}
          value={s.responsiveness}
          weight={0.20}
          color='bg-blue-500'
        />
        <MetricBar
          label={t('dashboard.platformPresence')}
          value={Math.round((s.platformCount / 7) * 100)}
          weight={0.15}
          color='bg-rose-400'
        />
      </div>

      {/* Recalculate button */}
      <button className='w-full py-3 bg-teal-500 hover:bg-teal-600 text-white
                         font-semibold rounded-xl transition-colors mb-24'>
        {t('dashboard.recalculate')}
      </button>

      {/* ── FAB ── */}
      <div className='fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2'>

        {/* Panel */}
        {fabOpen && (
          <div className='bg-white border border-slate-200 rounded-2xl shadow-xl p-4
                          flex flex-col gap-2 w-56'>
            <p className='text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1'>
              Simulate SME
            </p>
            {FAB_BUTTONS.map(btn => (
              <button
                key={btn.type}
                onClick={() => simulate(btn.type, btn.label.replace(/^\S+\s/, ''))}
                className={`text-sm font-medium border rounded-xl px-4 py-2
                            text-left transition-colors ${btn.style}`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* FAB trigger */}
        <button
          onClick={() => setFabOpen(o => !o)}
          className='bg-teal-500 hover:bg-teal-600 active:scale-95 text-white
                     font-semibold text-sm shadow-lg rounded-full px-5 py-3
                     transition-all duration-150'
        >
          {fabOpen ? '✕ Close' : '⚡ Mock Data'}
        </button>

      </div>

    </div>
  )
}