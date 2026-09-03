'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import styles from './post-job.module.css';

export default function PostJobPage() {
  const [formData, setFormData] = useState({
    jobTitle: '',
    company: '',
    location: '',
    workLocation: 'hybrid',
    jobType: 'full-time',
    experienceLevel: 'mid',
    salaryMin: '',
    salaryMax: '',
    currency: 'ZAR',
    description: '',
    responsibilities: '',
    requirements: '',
    benefits: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log('Job posting:', formData);
    setSubmitted(true);
  };

  return (
    <div className={styles.page}>
      <Header />

      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Post a Job</h1>
          <p className={styles.subtitle}>Fill in the details below to post your job opening</p>
        </div>

        {submitted ? (
          <div className={styles.successCard}>
            <div className={styles.successIcon}>✓</div>
            <h2 className={styles.successTitle}>Job Posted Successfully!</h2>
            <p className={styles.successText}>Your job has been posted and will be visible to job seekers immediately.</p>
            <div className={styles.successActions}>
              <Link href="/jobs">
                <Button variant="outline">Browse Applicants</Button>
              </Link>
              <Link href="/employers">
                <Button>Return to Employer Dashboard</Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Job Basic Information */}
            <fieldset className={styles.fieldset}>
              <legend className={styles.fieldsetTitle}>Job Information</legend>

              <Input
                type="text"
                name="jobTitle"
                label="Job Title"
                placeholder="e.g., Senior Frontend Developer"
                value={formData.jobTitle}
                onChange={handleChange}
                required
                fullWidth
              />

              <Input
                type="text"
                name="company"
                label="Company Name"
                placeholder="Your company name"
                value={formData.company}
                onChange={handleChange}
                required
                fullWidth
              />

              <Input
                type="text"
                name="location"
                label="Location"
                placeholder="e.g., Johannesburg, South Africa"
                value={formData.location}
                onChange={handleChange}
                required
                fullWidth
              />

              <div className={styles.twoCol}>
                <div>
                  <label className={styles.label}>Work Location</label>
                  <select name="workLocation" value={formData.workLocation} onChange={handleChange} className={styles.select}>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="on-site">On-site</option>
                  </select>
                </div>
                <div>
                  <label className={styles.label}>Job Type</label>
                  <select name="jobType" value={formData.jobType} onChange={handleChange} className={styles.select}>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="temporary">Temporary</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={styles.label}>Experience Level</label>
                <select name="experienceLevel" value={formData.experienceLevel} onChange={handleChange} className={styles.select}>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="executive">Executive</option>
                </select>
              </div>
            </fieldset>

            {/* Salary */}
            <fieldset className={styles.fieldset}>
              <legend className={styles.fieldsetTitle}>Salary Range (Optional)</legend>

              <div className={styles.twoCol}>
                <Input
                  type="number"
                  name="salaryMin"
                  label="Minimum Salary"
                  placeholder="e.g., 35000"
                  value={formData.salaryMin}
                  onChange={handleChange}
                  fullWidth
                />
                <Input
                  type="number"
                  name="salaryMax"
                  label="Maximum Salary"
                  placeholder="e.g., 50000"
                  value={formData.salaryMax}
                  onChange={handleChange}
                  fullWidth
                />
              </div>

              <div>
                <label className={styles.label}>Currency</label>
                <select name="currency" value={formData.currency} onChange={handleChange} className={styles.select}>
                  <option value="ZAR">ZAR (South African Rand)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="GBP">GBP (British Pound)</option>
                </select>
              </div>
            </fieldset>

            {/* Job Description */}
            <fieldset className={styles.fieldset}>
              <legend className={styles.fieldsetTitle}>Job Description</legend>

              <div>
                <label className={styles.label}>Job Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the role and what you're looking for..."
                  className={styles.textarea}
                  rows={5}
                />
              </div>

              <div>
                <label className={styles.label}>Responsibilities</label>
                <textarea
                  name="responsibilities"
                  value={formData.responsibilities}
                  onChange={handleChange}
                  placeholder="List key responsibilities (one per line)"
                  className={styles.textarea}
                  rows={5}
                />
              </div>

              <div>
                <label className={styles.label}>Requirements</label>
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleChange}
                  placeholder="List key requirements and qualifications (one per line)"
                  className={styles.textarea}
                  rows={5}
                />
              </div>

              <div>
                <label className={styles.label}>Benefits (Optional)</label>
                <textarea
                  name="benefits"
                  value={formData.benefits}
                  onChange={handleChange}
                  placeholder="List benefits (one per line)"
                  className={styles.textarea}
                  rows={3}
                />
              </div>
            </fieldset>

            {/* Actions */}
            <div className={styles.actions}>
              <Button type="submit" size="lg">
                Post Job
              </Button>
              <Link href="/employers">
                <Button variant="outline" size="lg">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        )}
      </div>

      <Footer />
    </div>
  );
}
