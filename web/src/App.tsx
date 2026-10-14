import { Hero } from './components/Hero';
import { IntroOverlay } from './components/Intro';
import { Join } from './components/Join';
import { Nav } from './components/Nav';
import { PartnersMap } from './components/PartnersMap';
import { About, Download, Faq, Footer, Why } from './components/Sections';
import { Stats } from './components/Stats';
import { useI18n } from './lang';
import { useReveal } from './useReveal';

export function App() {
  const { t } = useI18n();
  useReveal();
  return (
    <>
      <a className="skip" href="#main">
        {t('skip')}
      </a>
      <IntroOverlay />
      <Nav />
      <main id="main">
        <Hero />
        <About />
        <Why />
        <Stats />
        <PartnersMap />
        <Join />
        <Faq />
        <Download />
      </main>
      <Footer />
    </>
  );
}
