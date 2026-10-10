import { requireRole } from '@/lib/auth/server';
import { CandidateDetail } from './candidate-detail';

export default async function EmployerCandidateDetailPage({ params }: { params: { id: string } }) {
  await requireRole('employer');
  return <CandidateDetail candidateId={params.id} />;
}