import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { userApi } from '../../lib/api'

type Tab = 'profile' | 'platforms' | 'notifications' | 'account'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'profile', label: 'Profile', icon: '👤' },
  { key: 'platforms', label: 'Platforms', icon: '🌐' },
  { key: 'notifications', label: 'Notifications', icon: '🔔' },
  { key: 'account', label: 'Account', icon: '⚙️' },
]

const PLATFORMS = [
  { id: 'facebook', emoji: '📘', label: 'Facebook', connected: true },
  { id: 'instagram', emoji: '📸', label: 'Instagram', connected: true },
  { id: 'google', emoji: '🔍', label: 'Google Business', connected: false },
  { id: 'whatsapp', emoji: '💬', label: 'WhatsApp', connected: true },
  { id: 'tiktok', emoji: '🎵', label: 'TikTok', connected: false },
]

function ProfileTab() {
  const { user, refreshUser } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [business, setBusiness] = useState(user?.businessName || '')
  const [sector, setSector] = useState(user?.sector || 'Other')
  const [location, setLocation] = useState(user?.location || 'Other')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
      setBusiness(user.businessName || '')
      setSector(user.sector || 'Other')
      setLocation(user.location || 'Other')
    }
  }, [user])

  const handleSave = async () => {
    setLoading(true)
    try {
      await userApi.updateProfile({ name, businessName: business, sector, location })
      await refreshUser()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none transition-all'

  return (
    <div className='space-y-5'>
      <div className='grid grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Full name</label>
          <input value={name} onChange={e => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} className={inputClass} type='email' />
        </div>
      </div>

      <div>
        <label className='block text-sm font-medium text-slate-700 mb-1'>Business name</label>
        <input value={business} onChange={e => setBusiness(e.target.value)} className={inputClass} />
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Sector</label>
          <select value={sector} onChange={e => setSector(e.target.value)} className={inputClass + ' bg-white'}>
            {['Retail', 'Food & Beverage', 'Fashion', 'Beauty & Wellness', 'Technology', 'Education', 'Transport', 'Other'].map(s =>
              <option key={s}>{s}</option>
            )}
          </select>
        </div>
        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Location</label>
          <select value={location} onChange={e => setLocation(e.target.value)} className={inputClass + ' bg-white'}>
            {['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Nyeri', 'Malindi', 'Other'].map(l =>
              <option key={l}>{l}</option>
            )}
          </select>
        </div>
      </div>

      <div>
        <label className='block text-sm font-medium text-slate-700 mb-2'>Preferred language</label>
        <div className='flex gap-3'>
          {[{ code: 'en', label: 'English' }, { code: 'sw', label: 'Kiswahili' }].map(lang => (
            <button key={lang.code} type='button'
              className='flex-1 py-2 border-2 border-slate-200 rounded-lg text-sm
                         font-medium text-slate-600 hover:border-teal-400 hover:text-teal-600 transition-all'>
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleSave} disabled={loading}
        className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all
          ${saved
            ? 'bg-green-500 text-white'
            : 'bg-teal-500 hover:bg-teal-600 text-white disabled:opacity-50'}`}>
        {loading ? 'Saving...' : saved ? '✓ Saved!' : 'Save changes'}
      </button>
    </div>
  )
}

function PlatformsTab() {
  const [platforms, setPlatforms] = useState(PLATFORMS)

  const toggle = (id: string) =>
    setPlatforms(prev => prev.map(p => p.id === id ? { ...p, connected: !p.connected } : p))

  const connected = platforms.filter(p => p.connected).length

  return (
    <div>
      <div className='flex items-center justify-between mb-5'>
        <p className='text-sm text-slate-500'>{connected} of {platforms.length} connected</p>
        <div className='h-1.5 w-32 bg-slate-100 rounded-full overflow-hidden'>
          <div className='h-full bg-teal-500 rounded-full transition-all duration-500'
            style={{ width: `${(connected / platforms.length) * 100}%` }} />
        </div>
      </div>

      <div className='space-y-3'>
        {platforms.map(pl => (
          <div key={pl.id}
            className='flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-teal-200 transition-colors bg-white'>
            <div className='flex items-center gap-3'>
              <span className='text-2xl'>{pl.emoji}</span>
              <div>
                <p className='font-semibold text-slate-700 text-sm'>{pl.label}</p>
                <p className={`text-xs font-medium ${pl.connected ? 'text-teal-500' : 'text-slate-400'}`}>
                  {pl.connected ? '● Connected' : '○ Not connected'}
                </p>
              </div>
            </div>
            <button onClick={() => toggle(pl.id)}
              className={`text-xs font-semibold px-4 py-1.5 rounded-lg border transition-all
                ${pl.connected
                  ? 'border-red-200 text-red-500 bg-red-50 hover:bg-red-100'
                  : 'border-teal-200 text-teal-600 bg-teal-50 hover:bg-teal-100'}`}>
              {pl.connected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function NotificationsTab() {
  const [settings, setSettings] = useState({
    weeklyReport: true,
    scoreChange: true,
    newTip: true,
    platformAlert: false,
    emailDigest: true,
    smsAlerts: false,
  })

  const toggle = (key: keyof typeof settings) =>
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))

  const items = [
    { key: 'weeklyReport' as const, label: 'Weekly score report', desc: 'Get your weekly digital presence summary' },
    { key: 'scoreChange' as const, label: 'Score change alerts', desc: 'Notify me when my score goes up or down' },
    { key: 'newTip' as const, label: 'New recommendations', desc: 'Alert me when new tips are available' },
    { key: 'platformAlert' as const, label: 'Platform connection issues', desc: 'Alert if a platform gets disconnected' },
    { key: 'emailDigest' as const, label: 'Email digest', desc: 'Receive notifications via email' },
    { key: 'smsAlerts' as const, label: 'SMS alerts', desc: 'Receive notifications via SMS' },
  ]

  return (
    <div className='space-y-4'>
      {items.map(item => (
        <div key={item.key}
          className='flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white'>
          <div>
            <p className='text-sm font-semibold text-slate-700'>{item.label}</p>
            <p className='text-xs text-slate-400 mt-0.5'>{item.desc}</p>
          </div>
          <button onClick={() => toggle(item.key)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0
              ${settings[item.key] ? 'bg-teal-500' : 'bg-slate-200'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
              ${settings[item.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      ))}
    </div>
  )
}

function AccountTab() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const navigate = useNavigate()

  return (
    <div className='space-y-4'>

      {/* Legal & About */}
      <div className='p-4 border border-slate-200 rounded-xl bg-white space-y-1'>
        <h3 className='text-sm font-bold text-slate-700 mb-3'>Legal & About</h3>

        <button
          onClick={() => navigate('/privacy')}
          className='w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors group'
        >
          <span className='text-sm font-medium text-slate-600'>Privacy Policy</span>
          <ChevronRight size={18} className='text-slate-400 group-hover:text-slate-600 transition-colors' />
        </button>

        <button
          onClick={() => navigate('/terms')}
          className='w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors group'
        >
          <span className='text-sm font-medium text-slate-600'>Terms of Service</span>
          <ChevronRight size={18} className='text-slate-400 group-hover:text-slate-600 transition-colors' />
        </button>
      </div>

      {/* Change password */}
      <div className='p-4 border border-slate-200 rounded-xl bg-white'>
        <p className='text-sm font-semibold text-slate-700 mb-3'>Change password</p>
        <div className='space-y-3'>
          <input type='password' placeholder='Current password'
            className='w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-400 transition-all' />
          <input type='password' placeholder='New password'
            className='w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-400 transition-all' />
          <input type='password' placeholder='Confirm new password'
            className='w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-400 transition-all' />
          <button className='w-full py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-lg transition-colors'>
            Update password
          </button>
        </div>
      </div>

      {/* Export data */}
      <div className='flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white'>
        <div>
          <p className='text-sm font-semibold text-slate-700'>Export my data</p>
          <p className='text-xs text-slate-400 mt-0.5'>Download all your scores and history</p>
        </div>
        <button className='text-xs font-semibold text-teal-600 bg-teal-50 hover:bg-teal-100
                           border border-teal-200 px-3 py-1.5 rounded-lg transition-colors'>
          Export CSV
        </button>
      </div>

      {/* Sign out */}
      <div className='flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white'>
        <div>
          <p className='text-sm font-semibold text-slate-700'>Sign out</p>
          <p className='text-xs text-slate-400 mt-0.5'>Sign out of your account</p>
        </div>
        <button className='text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200
                           border border-slate-200 px-3 py-1.5 rounded-lg transition-colors'>
          Sign out
        </button>
      </div>

      {/* Delete account */}
      <div className={`p-4 border rounded-xl transition-colors
        ${showDeleteConfirm ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
        {!showDeleteConfirm ? (
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-semibold text-red-600'>Delete account</p>
              <p className='text-xs text-slate-400 mt-0.5'>Permanently delete your account and all data</p>
            </div>
            <button onClick={() => setShowDeleteConfirm(true)}
              className='text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100
                         border border-red-200 px-3 py-1.5 rounded-lg transition-colors'>
              Delete
            </button>
          </div>
        ) : (
          <div>
            <p className='text-sm font-bold text-red-600 mb-1'>Are you sure?</p>
            <p className='text-xs text-slate-500 mb-3'>This action cannot be undone. All your data will be permanently deleted.</p>
            <div className='flex gap-2'>
              <button onClick={() => setShowDeleteConfirm(false)}
                className='flex-1 py-2 border border-slate-300 text-slate-600 text-sm rounded-lg hover:bg-slate-50'>
                Cancel
              </button>
              <button className='flex-1 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors'>
                Yes, delete
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  return (
    <div className='p-4 md:p-8 max-w-4xl mx-auto min-h-screen flex flex-col'>
      <h1 className='text-2xl font-black text-slate-800 mb-6'>Settings</h1>

      <div className='flex-1 flex flex-col gap-6'>

        {/* Content area (Top) */}
        <div className='flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-4'>
          <h2 className='text-lg font-bold text-slate-800 mb-6'>
            {TABS.find(t => t.key === activeTab)?.label}
          </h2>

          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'platforms' && <PlatformsTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'account' && <AccountTab />}
        </div>

        {/* Bottom Tabs (Horizontal) */}
        <div className='bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm flex gap-1 overflow-x-auto no-scrollbar'>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap
                ${activeTab === tab.key
                  ? 'bg-teal-50 text-teal-600 shadow-sm border border-teal-100'
                  : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <span className='text-lg'>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}