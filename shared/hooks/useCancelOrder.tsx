import { Text } from '@mantine/core';
import { useCancelOrderMutation } from '@/lib/api/orderApi';
import { ModalService, NotificationService } from '../services';

export function useCancelOrder(number: number, issued: string) {
  const [cancel, result] = useCancelOrderMutation();

  const cancelOrderAccept = () => {
    cancel({ issued, number }).then((res) => {
      // ✅ ИСПРАВЛЕНИЕ №1: Строгий и безопасный перехват ошибок мутации по стандартам Next.js 15
      if ('error' in res || res.error) {
        const errorData = res.error;
        NotificationService.showErrorNotification({
          // ✅ ИСПРАВЛЕНИЕ №2: Корректное извлечение сообщения сервера из вложенного объекта .data
          message: (errorData as any)?.data?.message ?? (errorData as any)?.message ?? 'Не удалось отменить заказ'
        });
        return; // Прерываем функцию, не допуская ложного вызова успешного уведомления
      }

      // Если в объекте ответа нет поля error — запрос гарантированно прошел успешно
      NotificationService.showSuccessNotification({ 
        message: `Заказ ${number}-${issued} успешно отменен` 
      });
    });
  };

  const cancelOrder = () => {
    ModalService.openDeleteModal({
      title: 'Вы точно хотите отменить заказ?',
      children: (
        <Text size="sm">
          После отмены заказа его будет невозможно вернуть
        </Text>
      ),
      labels: { cancel: 'Назад', confirm: 'Отменить заказ' },
      onConfirm: () => { cancelOrderAccept(); },
      onCancel: () => NotificationService.showSuccessNotification({ message: 'Действие остановлено' }),
    });
  };

  return { cancelOrder, result };
}
