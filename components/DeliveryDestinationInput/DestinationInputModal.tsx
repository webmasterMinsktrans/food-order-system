'use client';

import classes from './styles.module.scss';
import { Button, Flex, Group, Modal, ModalProps, Skeleton, Stack, Title } from "@mantine/core";
import { ErrorPage, Select } from "@/UI";
import { useForm } from "@mantine/form";
import { useGetDeliveryPointsQuery } from "@/lib/api/menuApi";
import { useEffect, useMemo } from "react"; // 👈 Заменили useState на useMemo
import { useAppDispatch, useAppSelector } from "@/shared/hooks";
import { OfficeDto } from "@/shared/types";
import { changeDeliveryDestination, selectDeliveryDestination } from "@/lib/features/cart/cartSlice";

interface DestinationInputModalProps extends ModalProps {}

const DestinationInputModal = (props: DestinationInputModalProps) => {
  const { data, error, isSuccess, isFetching, refetch } = useGetDeliveryPointsQuery(undefined);
  const destination = useAppSelector(selectDeliveryDestination);
  const dispatch = useAppDispatch();

  const form = useForm({
    mode: 'uncontrolled', // ✅ Обеспечивает стабильную работу полей ввода в React 19
    initialValues: {
      destination: destination?.id ? `${destination.id}` : ''
    },
    validate: {
      destination: val => val === '' ? 'Выберите место доставки' : null,
    }
  });

  // ✅ ИСПРАВЛЕНИЕ №1: Полностью убираем useState([ ]) и ручной setOptions в useEffect.
  // Трансформируем и мемоизируем опции для селекта. Теперь ссылка в памяти стабильна.
  const options = useMemo(() => {
    if (!data || !isSuccess) return [];
    return data.map(({ name, id, address }) => ({
      value: id.toString(),
      label: `${name} (${address})` // Исправлена лишняя закрывающая скобка в строке
    }));
  }, [data, isSuccess]);

  // ✅ ИСПРАВЛЕНИЕ №2: Безопасная синхронизация стейта. 
  // Вытаскиваем примитивный id для отслеживания зависимостей, чтобы избежать каскадных ререндеров
  const destinationId = destination?.id;

  useEffect(() => {
    if (!data || !isSuccess || !destinationId) return;

    const hasOfficeInList = data.some((item) => +item.id === +destinationId);
    if (!hasOfficeInList) {
      dispatch(changeDeliveryDestination(null));
      form.setFieldValue('destination', '');
    }
  }, [data, isSuccess, destinationId, dispatch]);

  const onClose = () => {
    const res = form.validate();
    if (res.hasErrors) return;
    
    const selectedId = form.getValues().destination;
    const office = data?.find((val) => val.id === +selectedId);
    
    if (office) {
      dispatch(changeDeliveryDestination(office));
    }
    props.onClose();
  };

  if (error) {
    return (
      <Modal 
        withCloseButton={false} 
        {...props}
      >
        <ErrorPage 
          message={(error as any)?.data?.message ?? (error as any)?.message ?? 'Невозможно получить места доставки'} 
          onRetry={refetch}
        />
      </Modal>
    );
  }

  return (
    <Modal 
      withCloseButton={false} 
      {...props}
      onClose={onClose}
    >
      <Stack gap={'md'}>
        <Title order={3}>Выберите место доставки</Title>
        {isFetching && <Skeleton className={classes.skeleton} />}
        {
          isSuccess && !isFetching && 
          <Select 
            data={options} 
            key={form.key('destination')} // Добавлен ключ для корректного сброса в uncontrolled режиме
            {...form.getInputProps('destination')}
          /> 
        }
        <Group justify='flex-end'>
          <Button onClick={onClose} loading={isFetching}>Принять</Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default DestinationInputModal;
