/**
 * CareerSnap Mock Data
 * Realistic sample data for development and demonstration
 */

import { Job, Company, JobCategory, UserProfile, Application } from '@/lib/types';

const companies: Record<string, Company> = {
  acme: {
    id: 'acme-tech',
    name: 'Acme Technologies',
    description: 'Leading software solutions provider with a focus on cloud infrastructure.',
    industry: 'Technology',
    size: 'large',
    founded: 2010,
    website: 'acmetechnologies.com',
    location: 'Johannesburg, South Africa',
  },
  nexus: {
    id: 'nexus-digital',
    name: 'Nexus Digital',
    description: 'Digital transformation agency helping enterprises modernize.',
    industry: 'Technology',
    size: 'medium',
    founded: 2015,
    website: 'nexusdigital.com',
    location: 'Cape Town, South Africa',
  },
  zenith: {
    id: 'zenith-health',
    name: 'Zenith HealthCare',
    description: 'Healthcare technology platform improving patient outcomes.',
    industry: 'Healthcare',
    size: 'large',
    founded: 2012,
    website: 'zenithhealth.co.za',
    location: 'Johannesburg, South Africa',
  },
  pinnacle: {
    id: 'pinnacle-finance',
    name: 'Pinnacle Financial Group',
    description: 'Innovative fintech solutions for modern banking.',
    industry: 'Finance',
    size: 'large',
    founded: 2008,
    website: 'pinnaclefi.com',
    location: 'Johannesburg, South Africa',
  },
  innovate: {
    id: 'innovate-ai',
    name: 'Innovate AI Labs',
    description: 'Artificial intelligence research and implementation.',
    industry: 'Technology',
    size: 'small',
    founded: 2019,
    location: 'Pretoria, South Africa',
  },
  horizon: {
    id: 'horizon-energy',
    name: 'Horizon Energy Solutions',
    description: 'Renewable energy and sustainability solutions.',
    industry: 'Engineering',
    size: 'medium',
    founded: 2016,
    website: 'horizonenergy.co.za',
    location: 'Durban, South Africa',
  },
  velocity: {
    id: 'velocity-media',
    name: 'Velocity Media Group',
    description: 'Content creation and digital marketing agency.',
    industry: 'Marketing',
    size: 'small',
    founded: 2018,
    location: 'Cape Town, South Africa',
  },
  catalyst: {
    id: 'catalyst-education',
    name: 'Catalyst Education',
    description: 'Online learning platform revolutionizing education.',
    industry: 'Education',
    size: 'medium',
    founded: 2014,
    website: 'catalystedu.com',
    location: 'Johannesburg, South Africa',
  },
};

export const mockJobs: Job[] = [
  {
    id: 'job-001',
    title: 'Senior Frontend Developer',
    company: companies.acme,
    location: 'Johannesburg, South Africa',
    workLocation: 'hybrid',
    salary: {
      min: 35000,
      max: 50000,
      currency: 'ZAR',
    },
    jobType: 'full-time',
    experienceLevel: 'senior',
    description:
      'We are seeking an experienced Senior Frontend Developer to lead our web application development team. You will work with modern technologies and mentor junior developers while building scalable, user-friendly interfaces.',
    responsibilities: [
      'Lead the design and development of responsive web applications',
      'Mentor junior developers and conduct code reviews',
      'Collaborate with UX/UI designers and backend engineers',
      'Implement performance optimization strategies',
      'Participate in architectural decisions and technical planning',
    ],
    requirements: [
      '5+ years of frontend development experience',
      'Expert-level knowledge of React and TypeScript',
      'Strong understanding of web performance optimization',
      'Experience with modern development tools and CI/CD',
      'Excellent communication and leadership skills',
    ],
    benefits: ['Health insurance', 'Remote work flexibility', 'Professional development budget', 'Annual bonus'],
    postedDate: new Date('2024-11-01'),
    tags: ['React', 'TypeScript', 'Leadership'],
  },
  {
    id: 'job-002',
    title: 'Data Scientist',
    company: companies.pinnacle,
    location: 'Johannesburg, South Africa',
    workLocation: 'on-site',
    salary: {
      min: 42000,
      max: 58000,
      currency: 'ZAR',
    },
    jobType: 'full-time',
    experienceLevel: 'mid',
    description:
      'Join our data science team to build predictive models and provide insights that drive business decisions. You will work with large datasets and cutting-edge machine learning technologies.',
    responsibilities: [
      'Develop and deploy machine learning models',
      'Analyze complex datasets and identify patterns',
      'Create data visualizations and reports',
      'Collaborate with stakeholders to define analytical requirements',
      'Optimize model performance and accuracy',
    ],
    requirements: [
      '3+ years of data science or analytics experience',
      'Proficiency in Python and SQL',
      'Experience with machine learning frameworks (TensorFlow, scikit-learn)',
      'Strong statistical knowledge',
      'Excellent presentation skills',
    ],
    benefits: ['Competitive salary', 'Parking provided', 'Wellness program', 'Learning opportunities'],
    postedDate: new Date('2024-11-02'),
    tags: ['Python', 'Machine Learning', 'SQL'],
  },
  {
    id: 'job-003',
    title: 'Full Stack Developer',
    company: companies.nexus,
    location: 'Cape Town, South Africa',
    workLocation: 'remote',
    salary: {
      min: 28000,
      max: 42000,
      currency: 'ZAR',
    },
    jobType: 'full-time',
    experienceLevel: 'mid',
    description:
      'We are looking for a talented Full Stack Developer to join our remote team. You will work on diverse projects spanning frontend, backend, and database development.',
    responsibilities: [
      'Develop full-stack web applications',
      'Design and implement RESTful APIs',
      'Create responsive and accessible user interfaces',
      'Write clean, maintainable code',
      'Participate in agile development process',
    ],
    requirements: [
      '3+ years of full-stack development experience',
      'Proficiency in JavaScript/TypeScript',
      'Experience with React or Vue',
      'Backend experience with Node.js or similar',
      'Database design knowledge (SQL/NoSQL)',
    ],
    benefits: ['100% remote', 'Flexible hours', 'Home office setup stipend', 'Career growth'],
    postedDate: new Date('2024-10-30'),
    tags: ['JavaScript', 'Node.js', 'Remote'],
  },
  {
    id: 'job-004',
    title: 'Healthcare Administrator',
    company: companies.zenith,
    location: 'Johannesburg, South Africa',
    workLocation: 'on-site',
    salary: {
      min: 18000,
      max: 28000,
      currency: 'ZAR',
    },
    jobType: 'full-time',
    experienceLevel: 'entry',
    description:
      'Join our healthcare administration team to support the delivery of excellent patient care. You will manage scheduling, patient records, and support clinical staff.',
    responsibilities: [
      'Manage patient scheduling and records',
      'Process insurance and billing information',
      'Coordinate between patients and clinical staff',
      'Maintain HIPAA compliance and confidentiality',
      'Handle administrative inquiries',
    ],
    requirements: [
      'High school diploma or equivalent',
      'Experience with medical software systems',
      'Excellent organizational skills',
      'Strong attention to detail',
      'Patient-focused communication skills',
    ],
    benefits: ['Health benefits', 'Paid time off', 'Training programs', 'Staff discounts'],
    postedDate: new Date('2024-11-03'),
    tags: ['Healthcare', 'Entry-level'],
  },
  {
    id: 'job-005',
    title: 'DevOps Engineer',
    company: companies.acme,
    location: 'Johannesburg, South Africa',
    workLocation: 'hybrid',
    salary: {
      min: 38000,
      max: 52000,
      currency: 'ZAR',
    },
    jobType: 'full-time',
    experienceLevel: 'mid',
    description:
      'We need a skilled DevOps Engineer to manage our cloud infrastructure and improve deployment processes. You will ensure system reliability and optimize performance.',
    responsibilities: [
      'Manage AWS and cloud infrastructure',
      'Implement CI/CD pipelines',
      'Monitor system performance and security',
      'Automate operational processes',
      'Collaborate with development teams',
    ],
    requirements: [
      '4+ years of DevOps experience',
      'Expert knowledge of AWS or GCP',
      'Proficiency with Docker and Kubernetes',
      'Strong scripting skills (Python/Bash)',
      'Understanding of networking and security',
    ],
    benefits: ['Competitive salary', 'Remote flexibility', 'Learning budget', 'Performance bonus'],
    postedDate: new Date('2024-10-28'),
    tags: ['DevOps', 'AWS', 'Kubernetes'],
  },
  {
    id: 'job-006',
    title: 'UX/UI Designer',
    company: companies.velocity,
    location: 'Cape Town, South Africa',
    workLocation: 'hybrid',
    salary: {
      min: 22000,
      max: 35000,
      currency: 'ZAR',
    },
    jobType: 'full-time',
    experienceLevel: 'mid',
    description:
      'Join our creative team to design beautiful and functional user interfaces. You will work on web and mobile applications used by thousands of users.',
    responsibilities: [
      'Design user interfaces and experiences',
      'Create wireframes and prototypes',
      'Conduct user research and testing',
      'Collaborate with developers and product teams',
      'Maintain design consistency and systems',
    ],
    requirements: [
      '3+ years of UX/UI design experience',
      'Proficiency in Figma or similar tools',
      'Strong understanding of design principles',
      'Portfolio demonstrating design work',
      'Communication and collaboration skills',
    ],
    benefits: ['Creative environment', 'Flexible hours', 'Design software licenses', 'Team events'],
    postedDate: new Date('2024-11-04'),
    tags: ['Design', 'Figma', 'UX/UI'],
  },
  {
    id: 'job-007',
    title: 'Business Analyst',
    company: companies.horizon,
    location: 'Durban, South Africa',
    workLocation: 'hybrid',
    salary: {
      min: 24000,
      max: 38000,
      currency: 'ZAR',
    },
    jobType: 'full-time',
    experienceLevel: 'mid',
    description:
      'Help us analyze business requirements and improve our operations. You will bridge the gap between business needs and technical solutions.',
    responsibilities: [
      'Gather and analyze business requirements',
      'Create functional specifications',
      'Conduct stakeholder meetings',
      'Support system implementation',
      'Identify process improvements',
    ],
    requirements: [
      '3+ years of business analysis experience',
      'Strong analytical and problem-solving skills',
      'Proficiency with SQL and data analysis',
      'Excellent documentation abilities',
      'Communication and presentation skills',
    ],
    benefits: ['Professional development', 'Competitive salary', 'Flexible schedule', 'Project variety'],
    postedDate: new Date('2024-10-27'),
    tags: ['Business Analysis', 'SQL', 'Mid-level'],
  },
  {
    id: 'job-008',
    title: 'Junior Software Developer',
    company: companies.innovate,
    location: 'Pretoria, South Africa',
    workLocation: 'on-site',
    salary: {
      min: 16000,
      max: 24000,
      currency: 'ZAR',
    },
    jobType: 'full-time',
    experienceLevel: 'entry',
    description:
      'Start your development career with our innovative AI lab. You will work with experienced engineers to build cutting-edge AI solutions.',
    responsibilities: [
      'Write clean and tested code',
      'Collaborate with senior developers',
      'Learn and implement new technologies',
      'Contribute to code reviews',
      'Participate in team discussions',
    ],
    requirements: [
      'Recent graduate or bootcamp graduate',
      'Foundational knowledge of programming',
      'Familiarity with Python or JavaScript',
      'Eagerness to learn',
      'Strong teamwork skills',
    ],
    benefits: ['Mentorship program', 'Training opportunities', 'Casual environment', 'Career growth'],
    postedDate: new Date('2024-11-05'),
    tags: ['Python', 'Entry-level', 'AI'],
  },
  {
    id: 'job-009',
    title: 'Product Manager',
    company: companies.catalyst,
    location: 'Johannesburg, South Africa',
    workLocation: 'hybrid',
    salary: {
      min: 40000,
      max: 60000,
      currency: 'ZAR',
    },
    jobType: 'full-time',
    experienceLevel: 'senior',
    description:
      'Lead the vision and strategy for our educational platform. You will work with cross-functional teams to build features that impact millions of learners.',
    responsibilities: [
      'Define product vision and roadmap',
      'Prioritize features and improvements',
      'Work with design and engineering teams',
      'Analyze metrics and user feedback',
      'Lead product launches and initiatives',
    ],
    requirements: [
      '5+ years of product management experience',
      'Proven track record of successful launches',
      'Strong analytical and communication skills',
      'Knowledge of education or SaaS',
      'Leadership and decision-making abilities',
    ],
    benefits: ['Competitive salary', 'Equity options', 'Flexible work', 'Annual retreat'],
    postedDate: new Date('2024-10-29'),
    tags: ['Product Management', 'Leadership', 'Senior'],
  },
  {
    id: 'job-010',
    title: 'Quality Assurance Tester',
    company: companies.acme,
    location: 'Johannesburg, South Africa',
    workLocation: 'on-site',
    salary: {
      min: 15000,
      max: 23000,
      currency: 'ZAR',
    },
    jobType: 'full-time',
    experienceLevel: 'entry',
    description:
      'Help us deliver high-quality software by thoroughly testing our applications. You will work with developers to identify and document bugs.',
    responsibilities: [
      'Execute test plans and test cases',
      'Document and report bugs',
      'Perform regression testing',
      'Suggest improvements to testing processes',
      'Collaborate with development teams',
    ],
    requirements: [
      'High school diploma or equivalent',
      'Experience with testing tools',
      'Attention to detail and patience',
      'Good communication skills',
      'Willingness to learn automation testing',
    ],
    benefits: ['Training provided', 'Clear career path', 'Health insurance', 'Supportive team'],
    postedDate: new Date('2024-11-06'),
    tags: ['QA', 'Testing', 'Entry-level'],
  },
];

export const mockCategories: JobCategory[] = [
  { id: 'tech', name: 'Technology', jobCount: 342 },
  { id: 'healthcare', name: 'Healthcare', jobCount: 156 },
  { id: 'finance', name: 'Finance', jobCount: 289 },
  { id: 'engineering', name: 'Engineering', jobCount: 198 },
  { id: 'marketing', name: 'Marketing', jobCount: 124 },
  { id: 'education', name: 'Education', jobCount: 87 },
  { id: 'retail', name: 'Retail & Sales', jobCount: 456 },
  { id: 'admin', name: 'Administration', jobCount: 203 },
  { id: 'hospitality', name: 'Hospitality', jobCount: 112 },
  { id: 'hr', name: 'Human Resources', jobCount: 95 },
];

export const mockUserProfile: UserProfile = {
  id: 'user-001',
  email: 'jane.smith@email.com',
  firstName: 'Jane',
  lastName: 'Smith',
  location: 'Johannesburg, South Africa',
  headline: 'Frontend Developer @ Tech Company',
  summary:
    'Passionate about building beautiful, user-friendly web applications. 5 years of experience with React, TypeScript, and modern JavaScript.',
  phone: '+27 (0)11 123 4567',
  skills: ['React', 'TypeScript', 'JavaScript', 'CSS', 'HTML', 'Node.js', 'Git', 'Figma'],
  experience: [
    {
      id: 'exp-001',
      jobTitle: 'Senior Frontend Developer',
      company: 'Tech Company',
      location: 'Johannesburg, South Africa',
      startDate: new Date('2021-03-01'),
      isCurrent: true,
      description: 'Led frontend team, designed component architecture, mentored junior developers.',
    },
    {
      id: 'exp-002',
      jobTitle: 'Frontend Developer',
      company: 'Digital Agency',
      location: 'Cape Town, South Africa',
      startDate: new Date('2019-06-01'),
      endDate: new Date('2021-02-28'),
      isCurrent: false,
      description: 'Built responsive web applications, collaborated with designers and backend engineers.',
    },
  ],
  education: [
    {
      id: 'edu-001',
      institution: 'University of Johannesburg',
      qualification: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: new Date('2015-02-01'),
      endDate: new Date('2019-11-30'),
      isCurrent: false,
    },
  ],
  profileCompletion: 85,
};

export const mockApplications: Application[] = [
  {
    id: 'app-001',
    jobId: 'job-001',
    appliedDate: new Date('2024-10-20'),
    status: 'interview',
    nextStep: 'Technical interview on November 15',
  },
  {
    id: 'app-002',
    jobId: 'job-005',
    appliedDate: new Date('2024-10-25'),
    status: 'viewed',
    nextStep: 'Expecting feedback within 3 days',
  },
  {
    id: 'app-003',
    jobId: 'job-009',
    appliedDate: new Date('2024-11-01'),
    status: 'applied',
    nextStep: 'Application under review',
  },
];

export function getJobById(id: string): Job | undefined {
  return mockJobs.find((job) => job.id === id);
}

export function searchJobs(query: string): Job[] {
  if (!query.trim()) return mockJobs;

  const lowerQuery = query.toLowerCase();
  return mockJobs.filter(
    (job) =>
      job.title.toLowerCase().includes(lowerQuery) ||
      job.company.name.toLowerCase().includes(lowerQuery) ||
      job.description.toLowerCase().includes(lowerQuery) ||
      job.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

export function filterJobs(
  jobs: Job[],
  filters: {
    jobType?: string;
    experienceLevel?: string;
    workLocation?: string;
    salaryMin?: number;
    salaryMax?: number;
    location?: string;
  }
): Job[] {
  return jobs.filter((job) => {
    if (filters.jobType && job.jobType !== filters.jobType) return false;
    if (filters.experienceLevel && job.experienceLevel !== filters.experienceLevel) return false;
    if (filters.workLocation && job.workLocation !== filters.workLocation) return false;
    if (filters.location && !job.location.toLowerCase().includes(filters.location.toLowerCase()))
      return false;
    if (filters.salaryMin && job.salary && job.salary.min < filters.salaryMin) return false;
    if (filters.salaryMax && job.salary && job.salary.max > filters.salaryMax) return false;
    return true;
  });
}
