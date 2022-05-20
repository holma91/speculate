import React from 'react';
// WARNING: IF THE LINE BELOW IS REMOVED IT WONT COMPILE,
// because of "ReferenceError: regeneratorRuntime is not defined"
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
import Table, {
  SelectColumnFilter,
  StatusPill,
  AvatarCell,
} from '../components/Table';
import styled from 'styled-components';

const getData = () => {
  const data = [
    {
      name: 'Jane Cooper',
      email: 'jane.cooper@example.com',
      title: 'Regional Paradigm Technician',
      department: 'Optimization',
      status: 'Active',
      role: 'Admin',
      age: 27,
      imgUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60',
    },
    {
      name: 'Cody Fisher',
      email: 'cody.fisher@example.com',
      title: 'Product Directives Officer',
      department: 'Intranet',
      status: 'Active',
      role: 'Owner',
      age: 43,
      imgUrl:
        'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60',
    },
    {
      name: 'Esther Howard',
      email: 'esther.howard@example.com',
      title: 'Forward Response Developer',
      department: 'Directives',
      status: 'Active',
      role: 'Member',
      age: 32,
      imgUrl:
        'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60',
    },
    {
      name: 'Jenny Wilson',
      email: 'jenny.wilson@example.com',
      title: 'Central Security Manager',
      department: 'Program',
      status: 'Active',
      role: 'Member',
      age: 29,
      imgUrl:
        'https://images.unsplash.com/photo-1498551172505-8ee7ad69f235?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60',
    },
    {
      name: 'Kristin Watson',
      email: 'kristin.watson@example.com',
      title: 'Lean Implementation Liaison',
      department: 'Mobility',
      status: 'Active',
      role: 'Admin',
      age: 36,
      imgUrl:
        'https://images.unsplash.com/photo-1532417344469-368f9ae6d187?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60',
    },
    {
      name: 'Cameron Williamson',
      email: 'cameron.williamson@example.com',
      title: 'Internal Applications Engineer',
      department: 'Security',
      status: 'Active',
      role: 'Member',
      age: 24,
      imgUrl:
        'https://images.unsplash.com/photo-1566492031773-4f4e44671857?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60',
    },
  ];
  return [...data, ...data, ...data];
};

function Tutorial() {
  const columns = React.useMemo(
    () => [
      {
        Header: 'Name',
        accessor: 'name',
        Cell: AvatarCell,
        imgAccessor: 'imgUrl',
        // emailAccessor: 'email',
      },
      {
        Header: 'Title',
        accessor: 'title',
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: StatusPill,
      },
      {
        Header: 'Age',
        accessor: 'age',
      },
      {
        Header: 'Role',
        accessor: 'role',
        Filter: SelectColumnFilter, // new
        filter: 'includes', // new
      },
    ],
    []
  );

  const data = React.useMemo(() => getData(), []);

  return (
    <OuterContainer>
      <InnerContainer>
        <div>
          <Table columns={columns} data={data} />
        </div>
      </InnerContainer>
    </OuterContainer>
  );
}

const OuterContainer = styled.div`
  min-height: 100vh; // min-h-screen
  /* background-color: rgb(243 244 246); // bg-gray-100 */
  color: rgb(17 24 39); // text-gray-900
`;

const InnerContainer = styled.main`
  max-width: 70rem; // max-w-4xl
  margin: 0 auto; // mx-auto
  padding-left: 1rem; // px-4
  padding-right: 1rem; // px-4
  // sm:px-6
  // lg:px-8
  padding-top: 1rem; // pt-4

  h1 {
    font-size: 1.25rem; // text-xl
    line-height: 1.75rem; // text-xl
    font-weight: 600; // font-semibold
  }

  .mt-4 {
    margin-top: 1rem; // mt-4
  }
`;

export default Tutorial;
