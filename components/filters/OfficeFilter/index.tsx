'use client';

import { useMemo } from "react"; // 👈 Добавили useMemo
import { useSearchParamState } from "../../../shared/hooks";
import OfficeSelect, { OfficeSelectProps } from "../../OfficeSelect/OfficeSelect";

interface OfficeFilterProps extends OfficeSelectProps {
  searchParam: string,
  arrayValue?: boolean
}

const OfficeFilter = ({ 
  searchParam,
  arrayValue = false,
  ...selectProps
}: OfficeFilterProps) => {
  const [value, setValue] = useSearchParamState(searchParam);

  // ✅ ИСПРАВЛЕНИЕ №1: Фильтруем входящее значение из URL.
  // Если кастомный хук роутера на первом кадре гидратации Next.js 15 вернул фантомную строку
  // "undefined" или "null", мы принудительно превращаем её в пустую строку "".
  // Это защитит инпут Mantine от багов отображения и заблокирует стартовую порчу URL-строки!
  const cleanValue = useMemo(() => {
    if (!value || value === 'undefined' || value === 'null') return '';
    return String(value);
  }, [value]);

  // ✅ ИСПРАВЛЕНИЕ №2: Контролируем событие изменения значения.
  // Запрос в URL запишется ТОЛЬКО тогда, когда модератор реально кликнет по элементу списка.
  const handleOfficeChange = (newValue: string | null) => {
    if (newValue === null || newValue === 'undefined' || newValue === '') {
      setValue(undefined as any); // Если сбросили фильтр — полностью удаляем параметр из URL
    } else {
      setValue(newValue as any);  // Если выбрали — записываем ID филиала
    }
  };

  return (
    <OfficeSelect
      label="Выберите филиал"
      placeholder="Все филиалы" // Добавили понятный плейсхолдер для дефолтного состояния
      {...selectProps}
      value={cleanValue} // Передаем очищенное безопасное значение
      onChange={handleOfficeChange} // Вызываем защищенный обработчик
    />
  );
};

export default OfficeFilter;
