import { PageHeaderContainer } from '@/components';

export default function UsersLayout({ children }: { children: any }) {
  return (
    <PageHeaderContainer title="Филиалы предприятия">
      { children }
    </PageHeaderContainer>
  );
}
