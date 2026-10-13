  const downloadFile = async () => {
    if (form.validate().hasErrors) return;
    const values = form.getValues();
    const params = { 
      periodStart: dayjs(values.periodStart).format(periodStringFormat),
      periodEnd: dayjs(values.periodEnd).format(periodStringFormat),
      deliveryDestinationId: values.deliveryDestinationId,
    };

    try {
      // 1. Получаем чистый ответ от бэкенда
      const result = await query(params).unwrap();
      
      // 2. Если бэкенд вообще ничего не прислал (null/undefined)
      if (!result) {
        throw new Error('Сервер вернул пустой ответ. Возможно, за этот период нет заказов.');
      }

      // 3. ГАРАНТИЯ: Принудительно создаем Blob из результата, 
      // чтобы браузер гарантированно понимал, что это файл Word (.docx)
      const fileBlob = result instanceof Blob 
        ? result 
        : new Blob([result], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

      // 4. Проверяем, что получившийся файл содержит данные
      if (fileBlob.size > 0) {
        const url = window.URL.createObjectURL(fileBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `orders_${dayjs().format('YYYY-MM-DD')}.docx`);
        document.body.appendChild(link);
        link.click();
        
        // Очищаем ресурсы
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);

        NotificationService.showSuccessNotification({
          title: 'Список заказов получен',
          message: 'Заказы пользователей, включенные в отчет, будут помечены как принятые',
        });
      } else {
        throw new Error('Размер файла отчета равен 0 байт. Нет данных для выгрузки.');
      }

    } catch (error) {
      console.error('Ошибка выгрузки:', error);
      
      NotificationService.showErrorNotification({
        title: 'Ошибка выгрузки заказов',
        message: (error as any)?.data?.message ?? (error as any)?.message ?? 'Невозможно скачать отчет о заказах'
      });
    }
  }
