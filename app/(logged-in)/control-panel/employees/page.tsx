import { SortOrderFilterBar , SearchInput, EmployeeList, OfficeFilter, EmployeeStatusFilter, CreateEmployeeButton, UpdateEmployeeListButton } from "@/components";
import classes from './styles.module.scss';
import commonClasses from '../styles.module.scss';
import { Group } from "@mantine/core";

const Employees = () => {
  return (
    <div className={commonClasses.pageContainer}>
      <Group justify='space-between'>
        <UpdateEmployeeListButton />
        <EmployeeStatusFilter children={undefined} className={classes.employeeFilter}/>
      </Group>
      <SortOrderFilterBar 
        sortFieldsOptionsDef={[
          {label:'id', 'value':'id'},
          {label:'Фамилия', 'value':'surname'},
          {label:'Табельный', 'value':'personnelNumber'},
        ]}
      >
        <OfficeFilter searchParam={"office"} arrayValue={false} />
      </SortOrderFilterBar>
      <SearchInput 
        placeholder="Введите строку для поиска"
        className={commonClasses.searchInput}  
      />
      <CreateEmployeeButton />
      <EmployeeList />
    </div>
  )
};

export default Employees;
