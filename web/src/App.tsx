import { Pricing } from './components/Pricing';
import { Hero } from './components/Hero';
import { IntroOverlay } from './components/Intro';
import { Join } from './components/Join';
import { Nav } from './components/Nav';
import { PartnersMap } from './components/PartnersMap';
import { About, Download, Faq, Footer } from './components/Sections';
import { Stats } from './components/Stats';
import { useI18n } from './lang';
import { route } from './route';
import { useReveal } from './useReveal';

export function App() {
  const { t } = useI18n();
  useReveal();
  return (
    <>
      <a className="skip" href="#main">
        {t('skip')}
      </a>
      {route === 'home' ? <IntroOverlay /> : null}
      <Nav />
      <main id="main" className={`page page-${route}`}>
        {route === 'pricing' ? (
          <Pricing standalone />
        ) : route === 'register' ? (
          <Join standalone />
        ) : (
          <>
            <Hero />
            <About />
            <Stats />
            <PartnersMap />
            <Faq />
            <Download />
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
