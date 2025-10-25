import './style.css';
import { FALLBACK_STARGAZERS_COUNT, getRepoStargazersCount } from './github-utils.js';
import { Header } from './components/Header.jsx';
import { Home } from './pages/Home/index.jsx';
import { LocationProvider, Router, Route, hydrate, prerender as ssr, useLocation } from 'preact-iso';
import { NotFound } from './pages/_404.jsx';
import Footer from './components/Footer.js';
import GetStarted from './pages/GetStarted/get-started.js';
import SupportUs from './pages/SupportUs/SupportUs.js';
import { createContext } from 'preact';
import { useEffect } from 'preact/hooks';
import { changeLanguage } from 'i18next';
import { LOCALES } from './i18n';

export const LocaleContext = createContext('en');

export function App(props: {repoStargazersCount: number}) {
	return (
		<LocationProvider>
            <LocaleProvider>
                <Header repoStargazersCount={props.repoStargazersCount} />
                <main>
                    <Router>
                        <Route path="/:locale:/" component={Home} />
                        <Route default component={NotFound} />
                        <Route path="/:locale:/get-started" component={GetStarted} />
                        <Route path="/:locale:/support-us" component={SupportUs} />
                    </Router>
                </main>
                <Footer />
            </LocaleProvider>
		</LocationProvider>
	);
}

export function LocaleProvider({ children }) {
  const { path } = useLocation();
  const localeId = path.split('/')[1] || 'en';

  useEffect(() => {
    changeLanguage(localeId);
    const correspondingLocale = LOCALES.find(l => l.id === localeId);
    document.documentElement.lang = localeId;
    document.documentElement.dir = correspondingLocale?.rtl ? "rtl" : "ltr";
  }, [ localeId ]);

  return (
    <LocaleContext.Provider value={localeId}>
      {children}
    </LocaleContext.Provider>
  );
}

if (typeof window !== 'undefined') {
	hydrate(<App repoStargazersCount={FALLBACK_STARGAZERS_COUNT} />, document.getElementById('app')!);
}

export async function prerender(data) {
	// Fetch the stargazer count of the Trilium's GitHub repo on prerender to pass
	// it to the App component for SSR.
	// This ensures the GitHub API is not called on every page load in the client.
	const stargazersCount = await getRepoStargazersCount();

	return await ssr(<App repoStargazersCount={stargazersCount} {...data} />);
}

