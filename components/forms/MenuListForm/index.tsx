'use client';

import { useEffect } from "react";
import { Box, Group, Skeleton, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useLazyGetMenuListQuery } from "@/lib/api/moderatorApi";
import { ErrorPage, Pagination, Select } from "@/UI";
import { OfficeSelect, MenuListTable } from "@/components";
import { IconSpider } from "@tabler/icons-react";
import { useSearchParamValue } from "@/shared/hooks";
import classes from './styles.module.scss';

interface MenuListFormProps {}

const MenuListForm = (props: MenuListFormProps) => {
  const [fetch, result] = useLazyGetMenuListQuery();
  const { data, error, isLoading } = result;
  const pageFromUrl = useSearchParamValue<number>('page');
  
  const form = useForm({
    mode: 'controlled',
    initialValues: {
      deliveryDestinationId: '',
      pageSize: '20'
    },
    validate: {
      deliveryDestinationId: (val) => !val ? 'Выберите место доставки' : null,
    },
  });

  // ✅ ИСПРАВЛЕНИЕ: Достаем значения контролируемо через watch или getValues() напрямую в константы
  const deliveryDestinationId = form.getValues().deliveryDestinationId;
  const pageSize = form.getValues().pageSize;
  const currentPage = pageFromUrl ?? 1;

  // ✅ Теперь useEffect следит за конкретными строками/числами, а не за ссылкой на объект
  useEffect(() => {
    if (!deliveryDestinationId) return;

    fetch({
      page: currentPage, 
      pageSize: +pageSize, 
      destinationOfficeId: +deliveryDestinationId
    });
  }, [deliveryDestinationId, pageSize, currentPage, fetch]); // Безопасные зависимости

  return (
    <div className={classes.formBox}>
      <Group className={classes.selectGroup}>
        <OfficeSelect 
          label='Выберите целевой филиал'
          inputProps={form.getInputProps('deliveryDestinationId')}  
          inputKey={form.key('deliveryDestinationId')} 
          className={classes.select}
        />
        <Select 
          label='Количество элементов в таблице'
          data={['5','10','15','20']} 
          key={form.key('pageSize')} 
          {...form.getInputProps('pageSize')}
          className={classes.select}
        />
      </Group>
      {isLoading && <Skeleton mih={400} miw={1000}/>}
      {data && <MenuListTable items={data.menuList} />}
      {error && <ErrorPage message={(error as any).message}/>}
      {
        !deliveryDestinationId &&
        <Box className={classes.emptyContent}>
          <IconSpider size={160} stroke={1} />
          <Title>Филиал не выбран</Title>
        </Box>
      }
      { data &&
        <Group className={classes.paginationBox}>
          <Pagination total={data?.totalPages} />
        </Group>
      }
    </div>
  );
};

export default MenuListForm;
