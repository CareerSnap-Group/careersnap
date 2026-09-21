import { calculateProfileCompletion } from './profile-data';

describe('calculateProfileCompletion', () => {
  it('marks missing sections and calculates a real percentage', () => {
    const completion = calculateProfileCompletion({
      profile: {
        id: '1',
        email: 'name@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        full_name: 'Jane Doe',
        phone: null,
        location: null,
        city: 'Johannesburg',
        province: 'Gauteng',
        country: 'South Africa',
        headline: null,
        professional_headline: null,
        bio: 'Engineer',
        profile_photo_url: null,
        current_job_title: 'Developer',
        current_employer: 'CareerSnap',
        years_experience: 4,
        employment_status: 'employed',
        desired_job_title: null,
        desired_employment_type: null,
        desired_work_arrangement: null,
        preferred_locations: [],
        expected_salary: null,
        availability: 'immediately',
        availability_start_date: null,
        allow_employer_discovery: true,
      },
      skills: [{ name: 'TypeScript' }],
      experience: [{ job_title: 'Developer', company_name: 'CareerSnap', start_date: '2022-01-01', end_date: null, is_current: true, description: 'Work' }],
      education: [],
      certifications: [],
      languages: [],
      links: [],
      resumes: [],
    });

    expect(completion.percentage).toBeGreaterThan(0);
    expect(completion.percentage).toBeLessThan(100);
    expect(completion.missingSections).toContain('Professional headline');
    expect(completion.missingSections).toContain('Education');
  });
});
