export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: ProfileInsert; Update: ProfileUpdate; Relationships: [] };
      experiences: { Row: Experience; Insert: ExperienceInsert; Update: ExperienceUpdate; Relationships: [] };
      education: { Row: Education; Insert: EducationInsert; Update: EducationUpdate; Relationships: [] };
      skills: { Row: Skill; Insert: SkillInsert; Update: SkillUpdate; Relationships: [] };
      resumes: { Row: Resume; Insert: ResumeInsert; Update: ResumeUpdate; Relationships: [] };
      companies: { Row: Company; Insert: CompanyInsert; Update: CompanyUpdate; Relationships: [] };
      employer_users: { Row: EmployerUser; Insert: EmployerUserInsert; Update: EmployerUserUpdate; Relationships: [] };
      jobs: { Row: Job; Insert: JobInsert; Update: JobUpdate; Relationships: [] };
      job_skills: { Row: JobSkill; Insert: JobSkillInsert; Update: JobSkillUpdate; Relationships: [] };
      applications: { Row: Application; Insert: ApplicationInsert; Update: ApplicationUpdate; Relationships: [] };
      saved_jobs: { Row: SavedJob; Insert: SavedJobInsert; Update: SavedJobUpdate; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_type: 'job_seeker' | 'employer';
      application_status: 'applied' | 'viewed' | 'interview' | 'offer' | 'rejected';
    };
    CompositeTypes: Record<string, never>;
  };
};

type Timestamps = { created_at: string; updated_at: string };
type Profile = Timestamps & { id: string; full_name: string | null; email: string | null; phone: string | null; location: string | null; headline: string | null; bio: string | null; profile_photo_url: string | null; user_type: Database['public']['Enums']['user_type'] };
type ProfileInsert = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>> & Pick<Profile, 'id'>;
type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
type Experience = Timestamps & { id: string; user_id: string; job_title: string; company_name: string; location: string | null; start_date: string; end_date: string | null; is_current: boolean; description: string | null };
type ExperienceInsert = Omit<Experience, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<Experience, 'id'>>;
type ExperienceUpdate = Partial<Omit<Experience, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
type Education = Timestamps & { id: string; user_id: string; institution: string; degree: string | null; field_of_study: string | null; start_date: string | null; end_date: string | null; description: string | null };
type EducationInsert = Omit<Education, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<Education, 'id'>>;
type EducationUpdate = Partial<Omit<Education, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
type Skill = Timestamps & { id: string; user_id: string; name: string; proficiency: string | null };
type SkillInsert = Omit<Skill, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<Skill, 'id'>>;
type SkillUpdate = Partial<Omit<Skill, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
type Resume = Timestamps & { id: string; user_id: string; file_name: string; storage_path: string; file_url: string | null; is_primary: boolean };
type ResumeInsert = Omit<Resume, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<Resume, 'id'>>;
type ResumeUpdate = Partial<Omit<Resume, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
type Company = Timestamps & { id: string; name: string; slug: string; description: string | null; website_url: string | null; logo_url: string | null; created_by: string };
type CompanyInsert = Omit<Company, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<Company, 'id'>>;
type CompanyUpdate = Partial<Omit<Company, 'id' | 'created_at' | 'updated_at'>>;
type EmployerUser = Timestamps & { company_id: string; user_id: string; role: string };
type EmployerUserInsert = Omit<EmployerUser, 'created_at' | 'updated_at'>;
type EmployerUserUpdate = Partial<Pick<EmployerUser, 'role'>>;
type Job = Timestamps & { id: string; company_id: string; title: string; slug: string; description: string; responsibilities: string[]; requirements: string[]; benefits: string[]; location: string; work_location: string; job_type: string; experience_level: string; salary_min: number | null; salary_max: number | null; salary_currency: string | null; status: string; published_at: string | null; expires_at: string | null; created_by: string };
type JobInsert = Omit<Job, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<Job, 'id'>>;
type JobUpdate = Partial<Omit<Job, 'id' | 'company_id' | 'created_at' | 'updated_at'>>;
type JobSkill = { job_id: string; skill_id: string; created_at: string };
type JobSkillInsert = Omit<JobSkill, 'created_at'>;
type JobSkillUpdate = never;
type Application = Timestamps & { id: string; job_id: string; user_id: string; applicant_id: string; resume_id: string | null; cover_letter: string | null; status: Database['public']['Enums']['application_status']; notes: string | null };
type ApplicationInsert = Omit<Application, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<Application, 'id'>>;
type ApplicationUpdate = Partial<Pick<Application, 'resume_id' | 'cover_letter' | 'status' | 'notes'>>;
type SavedJob = { user_id: string; job_id: string; created_at: string };
type SavedJobInsert = Omit<SavedJob, 'created_at'>;
type SavedJobUpdate = never;
