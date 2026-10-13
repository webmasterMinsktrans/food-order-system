'use client';

import UserCard from "@/components/cards/UserCard";
import { useSearchUsersQuery } from "@/lib/api/adminApi";
import { ErrorPage, Pagination } from "@/UI";
import { LoadingOverlay } from "@mantine/core";
import { FunctionComponent, useMemo } from "react"; // 👈 Добавили useMemo
import { useSearchParamValues } from "@/shared/hooks";
import classes from './styles.module.scss';
import searchEmpty from '@/public/search_state.gif';
import NoContentPage from "../../NoContentPage/NoContentPage";

interface AdminUserListProps {}
 
const AdminUserList: FunctionComponent<AdminUserListProps> = () => {
  const pageSize = 3;
  
  // ✅ ИСПРАВЛЕНИЕ №1: Деструктурируем параметры для удобного отслеживания в useMemo
  const [page, s, sortOrder, orderBy, office] = useSearchParamValues(['page', 's', 'order', 'sort', 'office']);

  // ✅ ИСПРАВЛЕНИЕ №2: Стабилизируем ссылку на объект параметров через useMemo
  const queryParams = useMemo(() => ({
    page: page ? +page : 1,
    pageSize,
    s: s || undefined,
    sortOrder: sortOrder || undefined,
    orderBy: orderBy || undefined,
    destinationOfficeId: office ? +office : undefined,
  }), [page, s, sortOrder, orderBy, office]);

  // Передаем мемоизированный queryParams вместо создания объекта "на лету"
  const { data, isFetching, error, refetch } = useSearchUsersQuery(queryParams);

  if (error) {
    return (
      <ErrorPage 
        message={(error as any)?.data?.message ?? (error as any)?.message ?? 'Неизвестная ошибка'} 
        onRetry={refetch}
      />
    );
  }

  // ✅ ИСПРАВЛЕНИЕ №3: Безопасная проверка пустого состояния. 
  // NoContentPage должен показываться только если загрузка завершена, а массив id пуст.
  const hasNoData = !isFetching && data && data.data.length === 0;

  if (isFetching || hasNoData) {
    return (
      <div className={classes.loadingBox}>
        {
          isFetching ?
          <LoadingOverlay visible />
          :
          <NoContentPage
            label="По вашему запросу ничего не найдено :("
            img={searchEmpty}
            size='sm'
          />
        }
      </div>
    );
  }

  return (
    <>
      {/* ✅ Теперь этот список рендерится стабильно, не вызывая каскадный спам запросами в UserCard */}
      {data?.data.map((id) => (
        <UserCard key={id} userId={id} />
      ))}
      
      {data && (
        <div className={classes.pagination}>
          <Pagination total={data.totalPages} />
        </div>
      )}
    </>
  );
};
 
export default AdminUserList;
