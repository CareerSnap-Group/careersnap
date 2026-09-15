import { requireRole } from '@/lib/auth/server';
import { EmployerHeader as Header } from '@/components/layout/employer-header';
import { Footer } from '@/components/layout/footer';
import { CandidateDetail } from './candidate-detail';

export default async function EmployerCandidateDetailPage({ params }: { params: { id: string } }) {
  await requireRole('employer');
  return <><Header /><CandidateDetail candidateId={params.id} /><Footer /></>;
}