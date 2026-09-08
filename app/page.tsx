'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/icons';
import { mockCategories } from '@/lib/mock-data';
import { createClient } from '@/lib/supabase/browser';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import styles from './page.module.css';

export default function HomePage() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [employerPromotionDismissed, setEmployerPromotionDismissed] = useState(false);
  const popularSearches = ['Software Developer', 'Registered Nurse', 'Data Analyst', 'Project Manager', 'Accountant', 'Marketing Manager'];

  useEffect(() => {
    setEmployerPromotionDismissed(sessionStorage.getItem('careersnap-employer-promotion-dismissed') === 'true');

    if (!isSupabaseConfigured()) {
      setSignedIn(false);
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const isLoggedOut = signedIn === false;

  const dismissEmployerPromotion = () => {
    sessionStorage.setItem('careersnap-employer-promotion-dismissed', 'true');
    setEmployerPromotionDismissed(true);
  };

  return (
    <div className={styles.page}>
      <Header variant="landing" />

      <main className={styles.homeBody}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <form className={styles.searchForm} onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const keyword = formData.get('keyword');
              const location = formData.get('location');
              window.location.href = `/jobs?keyword=${keyword}&location=${location}`;
            }}>
              <div className={styles.searchInputs}>
                <div className={styles.searchField}>
                  <Icon name="search" size={21} className={styles.searchIcon} />
                  <Input type="text" name="keyword" placeholder="Job title, keyword, or company" />
                </div>
                <div className={styles.searchField}>
                  <Icon name="map-pin" size={21} className={styles.locationIcon} />
                  <Input type="text" name="location" placeholder="City, province, or remote" />
                </div>
                <Button type="submit" size="lg" className={styles.searchButton}>
                  Find jobs
                </Button>
              </div>
            </form>

            <Image
              src="/careersnap-logo.png"
              alt="CareerSnap"
              width={300}
              height={66}
              className={styles.heroBrand}
              style={{ height: 'auto' }}
              priority
            />
            <h1 className={styles.heroTitle}>Find work that moves your career forward</h1>
            <p className={styles.heroSubtitle}>Discover opportunities from leading companies, explore new roles, and take the next step in your career.</p>
            {isLoggedOut ? (
              <Link href="/register" className={styles.primaryCta}>Get Started</Link>
            ) : signedIn ? (
              <Link href="/jobs" className={styles.primaryCta}>Find jobs</Link>
            ) : null}
          </div>
        </section>

        {isLoggedOut && !employerPromotionDismissed && (
          <aside className={styles.employerPromotion} aria-label="Employer promotion">
            <button
              type="button"
              className={styles.dismissPromotion}
              aria-label="Dismiss employer promotion"
              onClick={dismissEmployerPromotion}
            >
              ×
            </button>
            <div>
              <h2 className={styles.employerPromotionTitle}>Are you an employer?</h2>
              <p className={styles.employerPromotionText}>Post a job and reach qualified candidates.</p>
            </div>
            <Link href="/login?next=%2Femployers%2Fpost-job" className={styles.employerPromotionCta}>Post a Job</Link>
          </aside>
        )}

        <section className={styles.trending} aria-label="Popular searches">
          <p className={styles.trendingLabel}>Explore popular searches <Icon name="chevron-down" size={15} /></p>
          <div className={styles.searchTags}>
            {popularSearches.map((search) => (
              <Link key={search} href={`/jobs?keyword=${encodeURIComponent(search)}`} className={styles.searchTag}>
                {search}
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Browse by Category</h2>
            <div className={styles.categoriesGrid}>
              {mockCategories.map((category) => (
                <Link key={category.id} href={`/jobs?category=${category.id}`}>
                  <Card hoverable className={styles.categoryCard}>
                    <h3 className={styles.categoryName}>{category.name}</h3>
                    <p className={styles.categoryCount}>{category.jobCount} open positions</p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
