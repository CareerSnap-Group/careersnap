'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/icons';
import styles from './cvs.module.css';

type Candidate = {
  candidate_id: string;
  display_name: string | null;
  headline: string | null;
  location: string | null;
  skills: string[];
  experience: Array<{ job_title?: string; company_name?: string }>;
  education: Array<{ institution?: string }>;
  availability: string;
  has_cv: boolean;
};

type Filters = { keyword: string; location: string; skill: string; job_title: string; employment_type: string; availability: string; has_cv: string };
const initialFilters: Filters = { keyword: '', location: '', skill: '', job_title: '', employment_type: '', availability: '', has_cv: '' };

function availabilityLabel(value: string) { return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }

export function CandidateSearch() {
  const [filters, setFilters] = useState(initialFilters);
  const [activeFilters, setActiveFilters] = useState(initialFilters);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pageSize = 12;

  const loadCandidates = async (nextPage: number, nextFilters: Filters) => {
    setLoading(true); setError('');
    const params = new URLSearchParams({ page: String(nextPage), page_size: String(pageSize) });
    Object.entries(nextFilters).forEach(([key, value]) => { if (value) params.set(key, value); });
    const response = await fetch(`/api/employer/candidates?${params.toString()}`);
    const result = await response.json() as { candidates?: Candidate[]; error?: string };
    setLoading(false);
    if (!response.ok) { setError(result.error || 'We could not load candidates.'); setCandidates([]); return; }
    setCandidates(result.candidates || []);
  };

  useEffect(() => { void loadCandidates(1, initialFilters); }, []);

  const submitSearch = (event: FormEvent) => { event.preventDefault(); setPage(1); setActiveFilters(filters); void loadCandidates(1, filters); };
  const clearFilters = () => { setFilters(initialFilters); setActiveFilters(initialFilters); setPage(1); void loadCandidates(1, initialFilters); };
  const changePage = (nextPage: number) => { setPage(nextPage); void loadCandidates(nextPage, activeFilters); };
  const updateFilter = (name: keyof Filters, value: string) => setFilters((current) => ({ ...current, [name]: value }));

  return <>
    <form className={styles.filters} onSubmit={submitSearch}>
      <div className={styles.filterGrid}>
        <label className={styles.field}><span>Keyword</span><input value={filters.keyword} onChange={(event) => updateFilter('keyword', event.target.value)} placeholder="Skills, roles, experience" /></label>
        <label className={styles.field}><span>Location</span><input value={filters.location} onChange={(event) => updateFilter('location', event.target.value)} placeholder="City or region" /></label>
        <label className={styles.field}><span>Skill</span><input value={filters.skill} onChange={(event) => updateFilter('skill', event.target.value)} placeholder="e.g. React" /></label>
        <label className={styles.field}><span>Job title</span><input value={filters.job_title} onChange={(event) => updateFilter('job_title', event.target.value)} placeholder="e.g. Designer" /></label>
        <label className={styles.field}><span>Employment type</span><select value={filters.employment_type} onChange={(event) => updateFilter('employment_type', event.target.value)}><option value="">Any type</option><option value="full-time">Full-time</option><option value="part-time">Part-time</option><option value="contract">Contract</option><option value="temporary">Temporary</option><option value="internship">Internship</option></select></label>
        <label className={styles.field}><span>Availability</span><select value={filters.availability} onChange={(event) => updateFilter('availability', event.target.value)}><option value="">Any availability</option><option value="immediately">Immediately</option><option value="notice_period">Notice period</option><option value="not_available">Not available</option></select></label>
        <label className={styles.field}><span>CV availability</span><select value={filters.has_cv} onChange={(event) => updateFilter('has_cv', event.target.value)}><option value="">Any</option><option value="true">Has a CV</option><option value="false">No CV</option></select></label>
      </div>
      <div className={styles.filterActions}><Button type="submit" disabled={loading}>Search Candidates</Button><Button type="button" variant="outline" onClick={clearFilters}>Clear Filters</Button></div>
    </form>
    <div className={styles.resultsHeader}><h2 className={styles.resultsTitle}>Discoverable candidates</h2><span className={styles.resultsCount}>{loading ? 'Loading...' : `${candidates.length} result${candidates.length === 1 ? '' : 's'}`}</span></div>
    {error ? <Card className={styles.stateCard}><p className={styles.error}>{error}</p><Button type="button" variant="outline" onClick={() => void loadCandidates(page, activeFilters)}>Try Again</Button></Card> : loading ? <Card className={styles.stateCard}><p className={styles.muted}>Loading candidate profiles...</p></Card> : candidates.length === 0 ? <Card className={styles.stateCard}><h2>No candidates found</h2><p className={styles.muted}>Try broadening your search or clearing one of the filters.</p><Button type="button" variant="outline" onClick={clearFilters}>Clear Filters</Button></Card> : <div className={styles.resultsGrid}>{candidates.map((candidate) => <Card className={styles.candidateCard} key={candidate.candidate_id}><div className={styles.candidateTop}><div><h3>{candidate.display_name || 'CareerSnap Candidate'}</h3><p className={styles.headline}>{candidate.headline || 'Professional profile'}</p></div><span className={candidate.has_cv ? styles.cvBadge : styles.mutedBadge}>{candidate.has_cv ? 'CV available' : 'No CV'}</span></div>{candidate.location && <p className={styles.meta}><Icon name="map-pin" />{candidate.location}</p>}{candidate.availability !== 'not_specified' && <p className={styles.availability}>{availabilityLabel(candidate.availability)}</p>}{candidate.skills.length > 0 && <div className={styles.skillList}>{candidate.skills.slice(0, 6).map((skill) => <span key={skill}>{skill}</span>)}</div>}<p className={styles.summary}>{candidate.experience[0]?.job_title ? `${candidate.experience[0].job_title}${candidate.experience[0].company_name ? ` at ${candidate.experience[0].company_name}` : ''}` : candidate.education[0]?.institution || 'Profile details available'}</p><Link href={`/employer/cvs/${candidate.candidate_id}`} className={styles.viewLink}>View Profile <Icon name="chevron-right" size={14} /></Link></Card>)}</div>}
    {!loading && !error && candidates.length > 0 && <div className={styles.pagination}><Button type="button" variant="outline" disabled={page === 1} onClick={() => changePage(page - 1)}>Previous</Button><span>Page {page}</span><Button type="button" variant="outline" disabled={candidates.length < pageSize} onClick={() => changePage(page + 1)}>Next</Button></div>}
  </>;
}