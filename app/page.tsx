'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockJobs, mockCategories } from '@/lib/mock-data';
import { Icon } from '@/components/icons';
import styles from './page.module.css';

export default function HomePage() {
  // Get featured jobs (first 6)
  const featuredJobs = mockJobs.slice(0, 6);

  const popularSearches = ['Software Developer', 'Registered Nurse', 'Data Analyst', 'Project Manager', 'Accountant', 'Marketing Manager'];

  return (
    <div className={styles.page}>
      <Header />

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
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

      {/* Featured Jobs Section */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Featured Opportunities</h2>
            <Link href="/jobs">
              <Button variant="outline">View All Jobs</Button>
            </Link>
          </div>

          <div className={styles.jobsGrid}>
            {featuredJobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className={styles.jobCardLink}>
                <Card hoverable className={styles.jobCard}>
                  <div className={styles.jobHeader}>
                    <div>
                      <h3 className={styles.jobTitle}>{job.title}</h3>
                      <p className={styles.jobCompany}>{job.company.name}</p>
                    </div>
                  </div>

                  <div className={styles.jobInfo}>
                    <p className={styles.jobLocation}><Icon name="map-pin" />{job.location}</p>
                    {job.salary && (
                      <p className={styles.jobSalary}>
                        <Icon name="dollar-sign" />{job.salary.min.toLocaleString()}-{job.salary.max.toLocaleString()} {job.salary.currency}/month
                      </p>
                    )}
                  </div>

                  <div className={styles.jobMeta}>
                    <Badge variant="secondary">{job.jobType}</Badge>
                    <Badge variant="secondary">{job.workLocation}</Badge>
                  </div>

                  <p className={styles.jobDescription}>{job.description.substring(0, 100)}...</p>

                  <p className={styles.postedDate}>Posted {Math.floor((new Date().getTime() - job.postedDate.getTime()) / (1000 * 60 * 60 * 24))} days ago</p>
                </Card>
              </Link>
            ))}
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

      {/* Career Resources Section */}
      <section className={styles.section} style={{ backgroundColor: 'var(--color-background-secondary)' }}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Career Resources</h2>
          <div className={styles.resourcesGrid}>
            {[
              {
                title: 'Resume Tips',
                description: 'Learn how to craft a resume that gets noticed by hiring managers.',
              },
              {
                title: 'Interview Prep',
                description: 'Master the most common interview questions and scenarios.',
              },
              {
                title: 'Career Advice',
                description: 'Get expert guidance on career transitions and development.',
              },
              {
                title: 'Salary Insights',
                description: 'Explore salary ranges and compensation trends in your field.',
              },
            ].map((resource) => (
              <Card key={resource.title} className={styles.resourceCard}>
                <h3 className={styles.resourceTitle}>{resource.title}</h3>
                <p className={styles.resourceDescription}>{resource.description}</p>
                <Link href="/resources" className={styles.resourceLink}>
                  Learn more <Icon name="chevron-right" />
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Employer CTA Section */}
      <section className={styles.employerSection}>
        <div className={styles.container}>
          <div className={styles.employerContent}>
            <h2 className={styles.employerTitle}>Find your next great hire</h2>
            <p className={styles.employerDescription}>Post a job and reach thousands of qualified candidates looking for their next opportunity.</p>
            <Link href="/employers/post-job">
              <Button size="lg">Post a Job</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
