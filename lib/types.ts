/**
 * CareerSnap Type Definitions
 */

export interface Company {
  id: string;
  name: string;
  logo?: string;
  description: string;
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  founded?: number;
  website?: string;
  location: string;
}

export type JobType = 'full-time' | 'part-time' | 'contract' | 'temporary' | 'internship';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'executive';
export type WorkLocation = 'on-site' | 'hybrid' | 'remote';

export interface Job {
  id: string;
  title: string;
  company: Company;
  location: string;
  workLocation: WorkLocation;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits?: string[];
  postedDate: Date;
  applicantCount?: number;
  tags?: string[];
}

export interface JobCategory {
  id: string;
  name: string;
  icon?: string;
  jobCount?: number;
}

export type ApplicationStatus = 'applied' | 'viewed' | 'interview' | 'offer' | 'rejected';

export interface Application {
  id: string;
  jobId: string;
  job?: Job;
  appliedDate: Date;
  status: ApplicationStatus;
  nextStep?: string;
  notes?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  location?: string;
  headline?: string;
  summary?: string;
  phone?: string;
  avatar?: string;
  skills: string[];
  experience: WorkExperience[];
  education: Education[];
  profileCompletion: number;
}

export interface WorkExperience {
  id: string;
  jobTitle: string;
  company: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  isCurrent: boolean;
  description?: string;
}

export interface Education {
  id: string;
  institution: string;
  qualification: string;
  field?: string;
  startDate: Date;
  endDate?: Date;
  isCurrent: boolean;
}

export interface SavedJob {
  jobId: string;
  savedDate: Date;
}
