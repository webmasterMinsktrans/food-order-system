'use client';

import { TagsInput, TagsInputProps } from "@mantine/core";
import { useState, useMemo } from "react"; // 👈 Добавили useMemo
import { useSearchImageTagsQuery } from "@/lib/api/moderatorApi";
import { useDebounce } from "@/shared/hooks";

interface ImageTagsInputProps extends TagsInputProps {}

const ImageTagsInput = (props: ImageTagsInputProps) => {
  const [searchString, setSearchValue] = useState('');
  const debouncedSearchString = useDebounce(searchString, 300);

  // ✅ ИСПРАВЛЕНИЕ: Мемоизируем объект параметров.
  // Теперь ссылка в памяти изменится ТОЛЬКО тогда, когда изменится debouncedSearchString.
  const queryParams = useMemo(() => ({ 
    searchString: debouncedSearchString 
  }), [debouncedSearchString]);

  // Передаем стабильную ссылку queryParams вместо создания объекта "на лету"
  const { data } = useSearchImageTagsQuery(queryParams);

  // Преобразуем данные в массив строк для Mantine TagsInput
  const tagsData = useMemo(() => {
    return data?.map(({ tagName }) => tagName) ?? [];
  }, [data]);

  return (
    <TagsInput
      searchValue={searchString}
      onSearchChange={setSearchValue}
      data={tagsData}
      {...props}
    />
  );
};

export default ImageTagsInput;
