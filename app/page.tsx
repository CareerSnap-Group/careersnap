'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { mockCategories } from '@/lib/mock-data';
import styles from './page.module.css';

export default function HomePage() {
  const popularSearches = ['Software Developer', 'Registered Nurse', 'Data Analyst', 'Project Manager', 'Accountant', 'Marketing Manager'];

  return (
    <div className={styles.page}>
      <Header variant="landing" />

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
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

          {/* Search Form */}
          <form className={styles.searchForm} onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const keyword = formData.get('keyword');
            const location = formData.get('location');
            window.location.href = `/jobs?keyword=${keyword}&location=${location}`;
          }}>
            <div className={styles.searchInputs}>
              <div className={styles.searchField}>
                <Input type="text" name="keyword" placeholder="Job title, keyword, or company" />
              </div>
              <div className={styles.searchField}>
                <Input type="text" name="location" placeholder="City, province, or remote" />
              </div>
              <Button type="submit" size="lg" className={styles.searchButton}>
                Search Jobs
              </Button>
            </div>
          </form>

          {/* Popular Searches */}
          <div className={styles.popularSearches}>
            <p className={styles.popularLabel}>Popular searches:</p>
            <div className={styles.searchTags}>
              {popularSearches.map((search) => (
                <Link key={search} href={`/jobs?keyword=${encodeURIComponent(search)}`} className={styles.searchTag}>
                  {search}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Browse by Category Section */}
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

      <Footer />
    </div>
  );
}
