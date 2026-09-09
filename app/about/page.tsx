import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Icon } from '@/components/icons';
import styles from './about.module.css';

export const metadata = {
  title: 'About CareerSnap',
  description: 'Learn about CareerSnap, a career and recruitment app connecting job seekers with opportunities and helping employers discover talent.',
};

const audiences = [
  {
    icon: 'search' as const,
    label: 'For job seekers',
    title: 'Move your career forward',
    description: 'CareerSnap helps job seekers discover relevant opportunities, explore companies, manage their applications, and take the next step in their careers.',
    link: 'Explore jobs',
    href: '/jobs',
  },
  {
    icon: 'briefcase' as const,
    label: 'For employers',
    title: 'Find the right talent',
    description: 'CareerSnap gives employers a dedicated experience for posting jobs, discovering candidates, managing applications, and accessing tools designed to support recruitment.',
    link: 'Explore employer tools',
    href: '/employers',
  },
];

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <Header variant="landing" />

      <main>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <p className={styles.eyebrow}>About CareerSnap</p>
            <h1 className={styles.heroTitle}>A smarter way to connect people with opportunities.</h1>
            <p className={styles.heroLead}>
              CareerSnap is a career and recruitment app designed to make it easier for job seekers to discover opportunities and for employers to find the right talent.
            </p>
            <p className={styles.heroSupport}>
              We believe finding a job, or finding the right person for a job, should be simpler, more accessible, and less frustrating.
            </p>
            <div className={styles.heroRule} aria-hidden="true" />
            <p className={styles.heroFootnote}>One modern platform for job discovery, career opportunities, candidate discovery, and recruitment tools.</p>
          </div>
        </section>

        <section className={styles.audienceSection} aria-labelledby="audience-title">
          <div className={styles.sectionIntro}>
            <p className={styles.sectionKicker}>Designed around real career journeys</p>
            <h2 id="audience-title">One app, two important sides of the opportunity.</h2>
          </div>
          <div className={styles.audienceGrid}>
            {audiences.map((audience) => (
              <article key={audience.title} className={styles.audienceCard}>
                <div className={styles.iconFrame}><Icon name={audience.icon} size={22} /></div>
                <p className={styles.cardLabel}>{audience.label}</p>
                <h3>{audience.title}</h3>
                <p className={styles.cardDescription}>{audience.description}</p>
                <a href={audience.href} className={styles.cardLink}>
                  {audience.link}<Icon name="chevron-right" size={16} />
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.statementSection} aria-labelledby="mission-title">
          <div className={styles.statementGrid}>
            <div>
              <p className={styles.sectionKicker}>What guides the app</p>
              <h2 id="mission-title">Our Mission</h2>
            </div>
            <div className={styles.statementCopy}>
              <p>Our mission is to make career opportunities more accessible while helping employers connect with talent more efficiently.</p>
              <p>CareerSnap is built around a simple idea: the right opportunity can change a person&apos;s career, and the right person can help a business grow.</p>
            </div>
          </div>
        </section>

        <section className={styles.founderSection} aria-labelledby="founder-title">
          <div className={styles.founderPanel}>
            <div className={styles.founderMarker} aria-hidden="true"><Icon name="user" size={24} /></div>
            <div className={styles.founderContent}>
              <p className={styles.sectionKicker}>The person behind the platform</p>
              <h2 id="founder-title">Our Founder</h2>
              <p className={styles.founderName}>Lulama Lupin Makondo</p>
              <p className={styles.founderTitle}>Founder, CareerSnap</p>
              <p>CareerSnap was founded by Lulama Lupin Makondo with the vision of creating a modern platform that brings job seekers and employers together in a simpler and more accessible way.</p>
              <p>The idea behind CareerSnap is straightforward: use technology to reduce the friction between people looking for their next opportunity and organisations looking for their next great hire.</p>
            </div>
          </div>
        </section>

        <section className={styles.visionSection} aria-labelledby="vision-title">
          <div className={styles.visionInner}>
            <p className={styles.sectionKicker}>Where we are going</p>
            <h2 id="vision-title">Our Vision</h2>
            <p>To become a trusted career and recruitment platform that helps people discover opportunities and helps organisations discover talent.</p>
          </div>
        </section>

        <section className={styles.closingSection}>
          <p>Your next opportunity could be closer than you think.</p>
        </section>
      </main>

      <Footer />
    </div>
  );
}