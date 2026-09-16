import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import styles from '../informational.module.css';

export const metadata = { title: 'Privacy Policy | CareerSnap' };

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Draft for review</p>
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.lead}>This draft explains the types of information CareerSnap may handle through its current account, application, resume, and candidate discovery features. It should be reviewed and finalized before publication as a legal policy.</p>
        </header>
        <article className={styles.document}>
          <section><h2>Information We Collect</h2><p>CareerSnap may receive information you provide while creating an account, building a profile, posting a job, applying for a role, uploading a resume, or contacting the service.</p></section>
          <section><h2>Account Information</h2><p>Account information may include your name, email address, role selection, and profile details. Authentication is handled through the services configured for the application.</p></section>
          <section><h2>Job Applications</h2><p>When a Job Seeker applies, CareerSnap stores application details such as the selected job, cover letter, application status, notes, and associated account identifiers.</p></section>
          <section><h2>CV/Resume Information</h2><p>Uploaded resumes may include the information contained in those files. CareerSnap uses resume data to support the user&apos;s applications and resume management features.</p></section>
          <section><h2>Employer Candidate Discovery</h2><p>Job Seekers can control whether their profile is available for employer discovery. When discovery is enabled, eligible employers may see the profile information made available for that feature, including relevant experience, skills, location, headline, availability, and CV availability.</p></section>
          <section><h2>How Information Is Used</h2><p>Information is used to provide account access, job search, applications, resume management, employer candidate discovery, role-specific dashboards, and related service functionality.</p></section>
          <section><h2>Information Sharing</h2><p>Information may be shared with the employers or Job Seekers involved in a CareerSnap workflow, according to the feature being used and the choices made by the user. CareerSnap does not use a profile for employer discovery when discovery is disabled.</p></section>
          <section><h2>Data Security</h2><p>CareerSnap uses access controls and configured service features intended to protect information. No system can be described as completely secure, and detailed security commitments should be confirmed in a finalized policy.</p></section>
          <section><h2>Cookies</h2><p>CareerSnap may use essential browser storage or cookies needed for authentication, sessions, preferences, and application operation. See the Cookie Policy for the current functional description.</p></section>
          <section><h2>Data Retention</h2><p>Information may be retained while an account or related service record remains active, or as needed for the associated workflow. Specific retention periods should be established in a finalized policy.</p></section>
          <section><h2>User Rights</h2><p>Users may have rights to access, correct, update, or request deletion of personal information depending on applicable law and the service context. Requests can be directed to the CareerSnap team.</p></section>
          <section><h2>Third-Party Services</h2><p>CareerSnap may rely on third-party services for authentication, database storage, file storage, or other functionality configured for the application. Their own policies may also apply.</p></section>
          <section><h2>Changes to This Policy</h2><p>This draft may change as CareerSnap evolves. A finalized policy should explain how material updates will be communicated.</p></section>
          <section><h2>Contact</h2><p>For privacy questions or requests, contact the CareerSnap team through the support channel made available in the application.</p></section>
        </article>
      </main>
      <Footer />
    </div>
  );
}