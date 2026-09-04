'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import styles from './employers.module.css';

export default function EmployersPage() {
  return (
    <div className={styles.page}>
      <Header />

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Find your next great hire</h1>
          <p className={styles.heroSubtitle}>Post jobs and connect with thousands of qualified candidates actively searching for opportunities.</p>
          <Link href="/employers/post-job">
            <Button size="lg" className={styles.ctaButton}>
              Post a Job
            </Button>
          </Link>
        </div>
      </section>

      {/* Benefits Section */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Why choose CareerSnap?</h2>
          <div className={styles.benefitsGrid}>
            {[
              {
                title: 'Reach Qualified Candidates',
                description: 'Access a growing network of talented professionals actively seeking new opportunities.',
              },
              {
                title: 'Easy Job Posting',
                description: 'Post a job in minutes with our simple, intuitive job posting form.',
              },
              {
                title: 'Smart Matching',
                description: 'Our algorithm matches job postings with the most relevant candidates.',
              },
              {
                title: 'Affordable Pricing',
                description: 'Competitive pricing that delivers real value for recruiting needs.',
              },
              {
                title: 'Application Tracking',
                description: 'Manage all applications and candidate communication in one place.',
              },
              {
                title: 'Analytics & Insights',
                description: 'Track job posting performance and candidate engagement metrics.',
              },
            ].map((benefit, idx) => (
              <Card key={idx} className={styles.benefitCard}>
                <h3 className={styles.benefitTitle}>{benefit.title}</h3>
                <p className={styles.benefitDescription}>{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className={styles.section} style={{ backgroundColor: 'var(--color-background-secondary)' }}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>How it works</h2>
          <div className={styles.stepsGrid}>
            {[
              {
                number: '1',
                title: 'Create Account',
                description: 'Sign up with your company information',
              },
              {
                number: '2',
                title: 'Post a Job',
                description: 'Fill in job details and requirements',
              },
              {
                number: '3',
                title: 'Receive Applications',
                description: 'Get applications from qualified candidates',
              },
              {
                number: '4',
                title: 'Hire Top Talent',
                description: 'Review, interview, and make your hire',
              },
            ].map((step) => (
              <div key={step.number} className={styles.step}>
                <div className={styles.stepNumber}>{step.number}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDescription}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Simple, transparent pricing</h2>
          <div className={styles.pricingGrid}>
            {[
              {
                name: 'Per Job',
                price: 'R500',
                description: 'Post one job listing',
                features: [
                  'Job posting for 30 days',
                  'Up to 100 job views',
                  'Email notifications',
                  'Basic analytics',
                ],
              },
              {
                name: 'Professional',
                price: 'R1,500',
                description: 'Per month, up to 5 jobs',
                popular: true,
                features: [
                  'Up to 5 active jobs',
                  'Unlimited job views',
                  'Priority support',
                  'Advanced analytics',
                  'Featured job listings',
                  'Social media posting',
                ],
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                description: 'Unlimited for large teams',
                features: [
                  'Unlimited job postings',
                  'Unlimited applications',
                  'Dedicated support',
                  'Custom branding',
                  'API access',
                  'Bulk hiring tools',
                ],
              },
            ].map((plan) => (
              <Card key={plan.name} className={`${styles.pricingCard} ${plan.popular ? styles.popular : ''}`}>
                {plan.popular && <div className={styles.popularBadge}>Most Popular</div>}
                <h3 className={styles.planName}>{plan.name}</h3>
                <div className={styles.price}>{plan.price}</div>
                <p className={styles.priceDescription}>{plan.description}</p>
                <Button fullWidth variant={plan.popular ? 'primary' : 'outline'} className={styles.selectButton}>
                  Get Started
                </Button>
                <ul className={styles.featureList}>
                  {plan.features.map((feature, idx) => (
                    <li key={idx}><Icon name="check" />{feature}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Ready to start hiring?</h2>
            <p className={styles.ctaSubtitle}>Post your first job today and connect with qualified candidates</p>
            <Link href="/employers/post-job">
              <Button size="lg" style={{ marginTop: 'var(--spacing-lg)' }}>
                Post Your First Job
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
