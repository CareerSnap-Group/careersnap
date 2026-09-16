import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import styles from '../informational.module.css';

export const metadata = { title: 'Terms of Service | CareerSnap' };

export default function TermsPage() {
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Draft for review</p>
          <h1 className={styles.title}>Terms of Service</h1>
          <p className={styles.lead}>These draft terms describe the general expectations for using CareerSnap. They should be reviewed and finalized before being treated as formal legal terms.</p>
        </header>
        <article className={styles.document}>
          <section><h2>Introduction</h2><p>CareerSnap provides tools that help job seekers discover opportunities and employers manage recruitment activity. By using the service, you agree to use it responsibly and in accordance with applicable requirements.</p></section>
          <section><h2>Using CareerSnap</h2><p>You may use CareerSnap for legitimate career search, recruitment, and related professional purposes. Do not interfere with the service, misuse another person&apos;s account, or attempt to access areas you are not authorized to use.</p></section>
          <section><h2>Job Listings</h2><p>Employers are responsible for the accuracy, legality, and availability of their listings. CareerSnap does not guarantee that a listing will remain available or that an application will receive a response.</p></section>
          <section><h2>Job Seeker Accounts</h2><p>Job seekers are responsible for providing accurate account information and keeping access credentials secure. Account information should be kept current so that the service can operate as intended.</p></section>
          <section><h2>Employer Accounts</h2><p>Employers are responsible for their company information, job postings, candidate interactions, and compliance with obligations that apply to their hiring activity.</p></section>
          <section><h2>Applications</h2><p>Applications are submitted to support the hiring process. CareerSnap does not decide hiring outcomes and cannot guarantee an interview, offer, or employment.</p></section>
          <section><h2>User Responsibilities</h2><p>Users must provide information they have the right to share, respect other users, and avoid content that is deceptive, unlawful, discriminatory, or harmful.</p></section>
          <section><h2>Content and Information</h2><p>Users remain responsible for content they submit. You should review information before sharing it and remove or update content that is no longer accurate.</p></section>
          <section><h2>Third-Party Services</h2><p>CareerSnap may connect with third-party services to support authentication, storage, or other functionality. Those services may have their own terms and privacy practices.</p></section>
          <section><h2>Limitation of Liability</h2><p>This draft provision is subject to legal review. To the extent permitted by applicable law, CareerSnap would not be responsible for indirect losses arising from use of the service or reliance on user-submitted information.</p></section>
          <section><h2>Changes to These Terms</h2><p>These draft terms may be updated as CareerSnap develops. Any finalized version should explain how material changes will be communicated.</p></section>
          <section><h2>Contact</h2><p>For questions about these draft terms, contact the CareerSnap team through the support channel made available in the application.</p></section>
        </article>
      </main>
      <Footer />
    </div>
  );
}