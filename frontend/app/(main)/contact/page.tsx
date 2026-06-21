import { SupportLayout } from '@/components/support/SupportLayout';
import { SupportTicketForm } from '@/components/support/SupportTicketForm';

export default function ContactPage() {
  return (
    <SupportLayout title="문의하기" description="서비스 이용 중 궁금한 점이나 오류를 접수해주세요." currentPath="/contact">
      <SupportTicketForm type="inquiries" />
    </SupportLayout>
  );
}
