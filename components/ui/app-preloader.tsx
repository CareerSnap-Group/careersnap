import Image from 'next/image';
import styles from './app-preloader.module.css';

export function AppPreloader() {
  return (
    <main className={styles.screen}>
      <div className={styles.content} role="status" aria-label="Preparing your next opportunity">
        <Image
          src="/careersnap-authenticated-logo.png"
          alt="CareerSnap"
          width={1019}
          height={191}
          priority
          className={styles.logo}
        />
        <div className={styles.indicator} aria-hidden="true">
          <span className={styles.indicatorBar} />
        </div>
        <p className={styles.label}>Preparing your next opportunity</p>
      </div>
    </main>
  );
}
