'use client';

import { useSearchEmployeesQuery } from "@/lib/api/adminApi";
import { useSearchParamValues } from "@/shared/hooks";
import { ErrorPage, Pagination } from "@/UI";
import searchEmpty from '@/public/search_state.gif';
import { LoadingOverlay, Title } from "@mantine/core";
import Image from "next/image";
import { useMemo } from "react";
import EmployeesTable from "../../tables/EmployeesTable";
import commonClasses from '../styles.module.scss';

interface EmployeeListProps {}

const EmployeeList = (props: EmployeeListProps) => {
  const pageSize = 20;
  
  const [page, s, sortOrder, orderBy, office, active] = useSearchParamValues([
    'page', 's', 'order', 'sort', 'office', 'active'
  ]);

  // Стабилизируем ссылку на объект параметров через useMemo
  const queryParams = useMemo(() => ({
    page: page ? +page : 1,
    pageSize,
    s: s || undefined,
    sortOrder: sortOrder || undefined,
    orderBy: orderBy || undefined,
    active: active ? active === 'true' : undefined,
    destinationOfficeId: office ? +office : undefined,
  }), [page, s, sortOrder, orderBy, office, active]);

  // Отправляем запрос списка сотрудников
  const { data, isFetching, error, refetch } = useSearchEmployeesQuery(queryParams);

  if (error) {
    return (
      <ErrorPage 
        message={(error as any)?.data?.message ?? (error as any)?.message ?? 'Неизвестная ошибка'} 
        onRetry={refetch}
      />
    );
  }

  // ✅ ИСПРАВЛЕНИЕ №1: Безопасное извлечение массива данных с защитой от undefined
  const employeesItems = data?.data ?? [];
  const totalPagesCount = data?.totalPages ?? 1;

  // ✅ ИСПРАВЛЕНИЕ №2: Вычисляем реальное наличие данных в памяти браузера
  const hasLoadedData = data && employeesItems.length > 0;
  const hasNoData = !isFetching && data && employeesItems.length === 0;

  return (
    // ✅ ИСПРАВЛЕНИЕ №3: Оборачиваем весь рендер в контейнер с относительным позиционированием.
    // Мы полностью вырезали старый блокирующий "if (isFetching || hasNoData) return ...".
    // Теперь разметка стабильна, а LoadingOverlay мягко перекрывает контейнер, не разрушая связи Virtual DOM!
    <div style={{ position: 'relative', minHeight: '300px', width: '100%' }}>
      {/* Главный спиннер перекрывает список только во время активного сетевого запроса */}
      <LoadingOverlay visible={isFetching || !data} overlayProps={{ blur: 1 }} />
      
      {
        hasNoData ? (
          <div className={commonClasses.loadingBox}>
            <Image src={searchEmpty} width={250} height={250} alt="Nothing found" priority />
            <Title order={3} style={{ marginTop: '16px' }}>По вашему запросу ничего не найдено</Title>
          </div>
        ) : (
          // Отрисовываем контент, передавая безопасный массив employeesItems в таблицу
          <>
            <EmployeesTable items={employeesItems}/>
            
            {hasLoadedData && (
              <div className={commonClasses.pagination}>
                <Pagination total={totalPagesCount}/>
              </div>
            )}
          </>
        )
      }
    </div>
  );
};

export default EmployeeList;
