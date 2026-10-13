'use client';

import { useMemo, ChangeEvent } from "react"; // 👈 Добавили ChangeEvent
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

  // Очищаем входящее значение от текстовых фантомов роутера Next.js 15
  const cleanValue = useMemo(() => {
    if (!value || value === 'undefined' || value === 'null') return '';
    return String(value);
  }, [value]);

  // ✅ ИСПРАВЛЕНИЕ: Приводим тип аргумента к стандартному ChangeEvent<HTMLInputElement>.
  // Мы извлекаем текстовое значение через e.target.value, что полностью устраняет ошибку 
  // типизации компилятора, сохраняя при этом защиту от пустых строк.
  const handleOfficeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    if (!newValue || newValue === 'undefined' || newValue === '') {
      setValue(undefined as any); // Если сбросили инпут — удаляем параметр из URL
    } else {
      setValue(newValue as any);  // Если выбрали — записываем значение
    }
  };

  return (
    <OfficeSelect
      label="Выберите филиал"
      placeholder="Все филиалы"
      {...selectProps}
      value={cleanValue} 
      onChange={handleOfficeChange} // Теперь типы идеально совместимы!
    />
  );
};

export default OfficeFilter;

