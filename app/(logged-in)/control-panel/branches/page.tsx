import { BranchOfficeList, SortOrderFilterBar } from "@/components";
import commonClasses from '../styles.module.scss';

const Branches = () => {
  return (
    <div className={commonClasses.pageContainer}>
      <SortOrderFilterBar sortFieldsOptionsDef={[
          {label:'id', 'value':'id'},
          {label:'Дата изменения', 'value':'changed'},
          {label:'Дата создания', 'value':'created'},
        ]}
      />
      <BranchOfficeList />
    </div>
  );
};

export default Branches;