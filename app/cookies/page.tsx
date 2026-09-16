import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import styles from '../informational.module.css';

export const metadata = { title: 'Cookie Policy | CareerSnap' };

export default function CookiesPage() {
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Draft for review</p>
          <h1 className={styles.title}>Cookie Policy</h1>
          <p className={styles.lead}>This draft explains the limited browser storage and cookie use needed to operate CareerSnap. It should be reviewed and finalized as the service develops.</p>
        </header>
        <article className={styles.document}>
          <section><h2>What Cookies Are</h2><p>Cookies are small pieces of information stored by a website in a browser. Similar browser storage technologies can serve related purposes.</p></section>
          <section><h2>How CareerSnap Uses Cookies</h2><p>CareerSnap may use cookies or browser storage to support authentication, maintain a session, remember limited preferences, and keep core application workflows working.</p></section>
          <section><h2>Essential Cookies</h2><p>Essential storage helps the application identify an active session and protect authenticated routes. Disabling it may prevent sign-in and protected features from working correctly.</p></section>
          <section><h2>Authentication and Session Cookies</h2><p>Authentication-related session data supports sign-in, account recovery, role-aware access, and maintaining a user&apos;s authenticated state.</p></section>
          <section><h2>Preference and Functional Cookies</h2><p>CareerSnap may store limited functional preferences in the browser, such as whether a dismissible interface prompt has already been dismissed.</p></section>
          <section><h2>Analytics and Performance Cookies</h2><p>The current repository does not confirm the use of analytics or advertising cookies. This draft therefore makes no claim that those cookies are currently used.</p></section>
          <section><h2>Managing Cookies</h2><p>Most browsers allow you to review, block, or remove cookies and site storage through their settings. Blocking essential storage may affect authentication and other core functionality.</p></section>
          <section><h2>Changes to This Policy</h2><p>This draft may be updated when CareerSnap&apos;s browser storage practices change. A finalized policy should explain how material updates will be communicated.</p></section>
          <section><h2>Contact</h2><p>For questions about cookies or browser storage, contact the CareerSnap team through the support channel made available in the application.</p></section>
        </article>
      </main>
      <Footer />
    </div>
  );
}