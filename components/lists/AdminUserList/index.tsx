'use client';

import UserCard from "@/components/cards/UserCard";
import { useSearchUsersQuery } from "@/lib/api/adminApi";
import { ErrorPage, Pagination } from "@/UI";
import { LoadingOverlay } from "@mantine/core";
import { FunctionComponent, useMemo } from "react";
import { useSearchParamValues } from "@/shared/hooks";
import classes from './styles.module.scss';
import searchEmpty from '@/public/search_state.gif';
import NoContentPage from "../../NoContentPage/NoContentPage";

interface AdminUserListProps {}
 
const AdminUserList: FunctionComponent<AdminUserListProps> = () => {
  const pageSize = 3;
  
  const [page, s, sortOrder, orderBy, office] = useSearchParamValues(['page', 's', 'order', 'sort', 'office']);

  // Стабилизируем ссылку на объект параметров через useMemo
  const queryParams = useMemo(() => ({
    page: page ? +page : 1,
    pageSize,
    s: s || undefined,
    sortOrder: sortOrder || undefined,
    orderBy: orderBy || undefined,
    destinationOfficeId: office ? +office : undefined,
  }), [page, s, sortOrder, orderBy, office]);

  // Отправляем запрос списка ID пользователей админки
  const { data, isFetching, error, refetch } = useSearchUsersQuery(queryParams);

  if (error) {
    return (
      <ErrorPage 
        message={(error as any)?.data?.message ?? (error as any)?.message ?? 'Неизвестная ошибка'} 
        onRetry={refetch}
      />
    );
  }

  // ✅ ИСПРАВЛЕНИЕ №1: Безопасное извлечение массива данных с защитой от undefined
  const usersIds = data?.data ?? [];
  const totalPagesCount = data?.totalPages ?? 1;

  // ✅ ИСПРАВЛЕНИЕ №2: Вычисляем реальное наличие данных в памяти браузера
  const hasLoadedData = data && usersIds.length > 0;
  const hasNoData = !isFetching && data && usersIds.length === 0;

  return (
    // ✅ ИСПРАВЛЕНИЕ №3: Оборачиваем весь рендер в контейнер с относительным позиционированием.
    // Мы полностью вырезали старый блокирующий "if (isFetching || hasNoData) return ...".
    // Теперь разметка стабильна, а LoadingOverlay мягко перекрывает контейнер, не разрушая связи Virtual DOM!
    <div style={{ position: 'relative', minHeight: '300px', width: '100%' }}>
      {/* Главный спиннер перекрывает список только во время активного сетевого запроса */}
      <LoadingOverlay visible={isFetching || !data} overlayProps={{ blur: 1 }} />
      
      {
        hasNoData ? (
          <div className={classes.loadingBox}>
            <NoContentPage
              label="По вашему запросу ничего не найдено :("
              img={searchEmpty}
              size='sm'
            />
          </div>
        ) : (
          // Отрисовываем контент, передавая безопасный массив usersIds в цикл .map()
          <>
            {usersIds.map((id) => (
              <UserCard key={id} userId={id} />
            ))}
            
            {hasLoadedData && (
              <div className={classes.pagination}>
                <Pagination total={totalPagesCount} />
              </div>
            )}
          </>
        )
      }
    </div>
  );
};
 
export default AdminUserList;
