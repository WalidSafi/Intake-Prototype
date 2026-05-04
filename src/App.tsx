import { useEffect, useState } from 'react'
import AdminDashboard from './components/AdminDashboard'
import TattooIntake from './components/TattooIntake'

type Route = 'home' | 'intake' | 'admin'

function getRoute(): Route {
  if (window.location.hash === '#admin-panel') {
    return 'admin'
  }

  return window.location.hash === '#request-form' ||
    window.location.hash === '#tattoo-intake'
    ? 'intake'
    : 'home'
}

function Homepage() {
  const [authPanel, setAuthPanel] = useState<'signin' | 'signup' | null>(null)

  const openPrototype = () => {
    window.history.pushState(null, '', '#request-form')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <main className="min-h-screen bg-[#f7f0e8] text-[#201b18]">
      <nav
        className="fixed left-4 right-4 top-4 z-10 flex items-center justify-between gap-3"
        aria-label="Homepage navigation"
      >
        <a
          className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-[#dbd1c5] bg-white/90 px-4 text-sm font-bold text-[#8f4536] shadow-[0_8px_28px_rgba(43,32,25,0.12)] backdrop-blur transition hover:-translate-y-px hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#8f4536]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f0e8]"
          href="#admin-panel"
        >
          <svg
            aria-hidden="true"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <rect height="8" rx="1.5" width="8" x="3" y="3" />
            <rect height="5" rx="1.5" width="8" x="13" y="3" />
            <rect height="8" rx="1.5" width="8" x="13" y="13" />
            <rect height="5" rx="1.5" width="8" x="3" y="16" />
          </svg>
          <span>Dashboard</span>
        </a>

        <div className="flex items-center gap-2">
          <button
            className="min-h-[42px] rounded-lg border border-[#dbd1c5] bg-white/90 px-4 text-sm font-bold text-[#5a4d46] shadow-[0_8px_28px_rgba(43,32,25,0.1)] backdrop-blur transition hover:-translate-y-px hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#8f4536]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f0e8]"
            type="button"
            onClick={() =>
              setAuthPanel((current) => (current === 'signin' ? null : 'signin'))
            }
          >
            Sign in
          </button>
          <button
            className="min-h-[42px] rounded-lg bg-[#8f4536] px-4 text-sm font-bold text-white shadow-[0_8px_28px_rgba(43,32,25,0.16)] transition hover:-translate-y-px hover:bg-[#723429] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#8f4536]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f0e8]"
            type="button"
            onClick={() =>
              setAuthPanel((current) => (current === 'signup' ? null : 'signup'))
            }
          >
            Sign up
          </button>
        </div>
      </nav>
      {authPanel && (
        <section
          className="fixed right-4 top-[72px] z-20 grid w-[min(360px,calc(100vw-32px))] gap-3 rounded-lg border border-[#dbd1c5] bg-white p-4 text-[#201b18] shadow-[0_20px_60px_rgba(43,32,25,0.18)]"
          aria-label="Mock account panel"
        >
          <p className="m-0 text-xs font-bold tracking-[0.12em] text-[#8f4536] uppercase">
            Prototype access
          </p>
          <h2 className="m-0 text-xl font-bold">
            {authPanel === 'signin' ? 'Mock sign in' : 'Mock sign up'}
          </h2>
          <p className="m-0 text-sm font-semibold text-[#5a4d46]">
            This prototype does not authenticate yet. Use Dashboard for the
            Nila B artist view, or open the request form.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <a
              className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-[#8f4536] px-3 text-sm font-bold text-white transition hover:bg-[#723429] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#8f4536]/25"
              href="#admin-panel"
            >
              Artist dashboard
            </a>
            <button
              className="min-h-[40px] rounded-lg border border-[#dbd1c5] px-3 text-sm font-bold text-[#5a4d46] transition hover:bg-[#f7f0e8] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#8f4536]/25"
              type="button"
              onClick={openPrototype}
            >
              Request form
            </button>
          </div>
        </section>
      )}
      <section className="grid min-h-screen items-center gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] lg:px-14">
        <div className="mx-auto grid w-full max-w-[720px] gap-7 lg:mx-0">
          <div className="grid gap-4">
            <p className="m-0 text-xs font-bold tracking-[0.12em] text-[#8f4536] uppercase">
              Boink request form prototype
            </p>
            <h1 className="m-0 max-w-[12ch] text-[3rem] leading-[0.98] font-bold sm:text-[4.6rem] lg:text-[5.5rem]">
              Welcome to Boink.
            </h1>
            <p className="m-0 max-w-[620px] text-lg leading-relaxed text-[#5a4d46]">
              Start the prototype to collect request details, booking location,
              availability, references, and Inbox.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              className="min-h-[50px] rounded-lg bg-[#8f4536] px-6 text-base font-bold text-white transition hover:-translate-y-px hover:bg-[#723429] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#8f4536]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f0e8]"
              type="button"
              onClick={openPrototype}
            >
              Open request form
            </button>
            <span className="text-sm font-semibold text-[#7a6a60]">
              Prototype route: #request-form
            </span>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[520px] lg:mx-0">
          
        </div>
      </section>
    </main>
  )
}

function App() {
  const [route, setRoute] = useState<Route>(getRoute)

  useEffect(() => {
    const syncRoute = () => setRoute(getRoute())

    window.addEventListener('hashchange', syncRoute)
    window.addEventListener('popstate', syncRoute)
    return () => {
      window.removeEventListener('hashchange', syncRoute)
      window.removeEventListener('popstate', syncRoute)
    }
  }, [])

  if (route === 'intake') {
    return <TattooIntake />
  }

  return route === 'admin' ? <AdminDashboard /> : <Homepage />
}

export default App
