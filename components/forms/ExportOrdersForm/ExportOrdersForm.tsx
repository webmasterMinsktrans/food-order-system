'use client';

import { Stack, Title, Button, StackProps } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useLazyOrderExportDocxQuery, periodStringFormat } from "@/lib/api/moderatorApi";
import { NotificationService } from "@/shared/services";
import { OfficeSelect } from "@/components";
import dayjs from "dayjs";
import classes from './styles.module.scss';

interface ExportOrdersFormProps extends StackProps {} 

const ExportOrdersForm = (props: ExportOrdersFormProps) => {
  const [query, {isFetching}] = useLazyOrderExportDocxQuery();
  const form = useForm({
    mode:'uncontrolled',
    initialValues: {
      periodStart: dayjs(new Date()).set('h', 7).set('m', 0).toDate(),
      periodEnd: dayjs(new Date()).set('m', 60).toDate(),
      deliveryDestinationId: '',
    },
    validate:{
      periodStart: (val, {periodEnd}) => {
        if(!val) return 'Дата не установлена';
        if(val > periodEnd) return 'Дата начала периода должна быть меньше даты окончания периода'
        return null;
      },
      periodEnd: (val) => {
        if(!val) return 'Дата не установлена';
        return null;
      },
      deliveryDestinationId: (val) => !val ? 'Выберите место доставки' : null,
    }
  });

  const downloadFile = async () => {
    if(form.validate().hasErrors) return;
    const values = form.getValues();
    const params = { 
      periodStart: dayjs(values.periodStart).format(periodStringFormat),
      periodEnd: dayjs(values.periodEnd).format(periodStringFormat),
      deliveryDestinationId: values.deliveryDestinationId,
    };

    try {
      // ✅ ИСПРАВЛЕНИЕ: Используем .unwrap(), чтобы вытащить чистый Blob из RTK Query
      const blob = await query(params).unwrap();
      
      // ✅ Создаем временную ссылку для браузера, чтобы файл скачался физически
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders_${dayjs().format('YYYY-MM-DD')}.docx`);
      document.body.appendChild(link);
      link.click();
      
      // Очищаем память
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      NotificationService.showSuccessNotification({
        title: 'Список заказов получен',
        message: 'Заказы пользователей включенные в отчет будут помечены как принятые',
      });
    } catch (error) {
      // ✅ Безопасный перехват ошибок
      NotificationService.showErrorNotification({
        title: 'Ошибка выгрузки заказов',
        message: (error as any)?.data?.message ?? (error as any)?.message ?? `Возникла непредвиденная ошибка. Невозможно скачать отчет о заказах`
      });
    }
  }

  return (
    <Stack {...props}>
      <Title>
        Выгрузка заказов пользователей
      </Title>
      <DateTimePicker
        valueFormat="DD MMMM YYYY HH:mm"
        label="Заказы созданные начиная с"
        placeholder="выберите дату"
        disabled={isFetching}
        key={form.key('periodStart')}
        {...form.getInputProps('periodStart')}
      />
      <DateTimePicker
        valueFormat="DD MMMM YYYY HH:mm"
        label="Заказы созданные по"
        placeholder="выберите дату"
        disabled={isFetching}
        maxDate={dayjs().set('h',24).set('m',0).toDate()}
        key={form.key('periodEnd')}
        {...form.getInputProps('periodEnd')}
      />
      <OfficeSelect 
        label='Выберите целевой филиал заказов'
        inputProps={form.getInputProps('deliveryDestinationId')}  
        inputKey={form.key('deliveryDestinationId')} 
      />
      <Button 
        className={classes.submitButton} 
        onClick={downloadFile}
        loading={isFetching}
      >
        СКАЧАТЬ
      </Button>
    </Stack>
  )
};

export default ExportOrdersForm;
