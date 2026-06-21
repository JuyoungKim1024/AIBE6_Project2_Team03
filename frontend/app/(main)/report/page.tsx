import { SupportLayout } from '@/components/support/SupportLayout';
import { SupportTicketForm } from '@/components/support/SupportTicketForm';

export default function ReportPage() {
  return (
    <SupportLayout title="신고센터" description="정책 위반 사용자나 콘텐츠를 신고해주세요." currentPath="/report">
      <SupportTicketForm type="reports" />
    </SupportLayout>
  );
}
