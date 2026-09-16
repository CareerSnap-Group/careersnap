import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import styles from '../informational.module.css';

export const metadata = {
  title: 'Career Resources | CareerSnap',
  description: 'Practical career resources for every stage of your job search.',
};

const resources = [
  ['Job Search', 'Build a focused search, compare opportunities, and make each application more intentional.'],
  ['CV & Resume', 'Shape a clear, relevant CV that helps employers understand your experience and strengths.'],
  ['Interviews', 'Prepare thoughtful examples, communicate your value, and approach interviews with confidence.'],
  ['Career Growth', 'Identify the skills, experiences, and next steps that can move your career forward.'],
  ['Workplace Advice', 'Find practical guidance for communication, collaboration, and making a strong start in a new role.'],
  ['Career Planning', 'Create a realistic direction for your career and revisit it as your goals develop.'],
] as const;

export default function ResourcesPage() {
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Career resources</p>
          <h1 className={styles.title}>Tools for your next career move.</h1>
          <p className={styles.lead}>Explore practical guidance for finding opportunities, presenting your experience, and building a career with intention.</p>
        </header>
        <section className={styles.grid} aria-label="Career resource categories">
          {resources.map(([title, description]) => (
            <article key={title} className={styles.card}>
              <h2>{title}</h2>
              <p>{description}</p>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}