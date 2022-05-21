import React from 'react';
import {
  useTable,
  useGlobalFilter,
  useAsyncDebounce,
  useFilters,
  useSortBy,
  usePagination,
} from 'react-table';
import styled from 'styled-components';
import {
  ChevronDoubleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/react/solid';
import { Button, PageButton } from '../components/Button';


export function SelectColumnFilter({
  column: { filterValue, setFilter, preFilteredRows, id, render },
}) {
  // Calculate the options for filtering
  // using the preFilteredRows
  const options = React.useMemo(() => {
    const options = new Set();
    preFilteredRows.forEach((row) => {
      options.add(row.values[id]);
    });
    return [...options.values()];
  }, [id, preFilteredRows]);

  // Render a multi-select box
  return (
    <FilterLabel>
      <span className="text-gray-700">{render('Header')}: </span>
      <StyledSelect
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        name={id}
        id={id}
        value={filterValue}
        onChange={(e) => {
          setFilter(e.target.value || undefined);
        }}
      >
        <option value="">All</option>
        {options.map((option, i) => (
          <option key={i} value={option}>
            {option}
          </option>
        ))}
      </StyledSelect>
    </FilterLabel>
  );
}

function GlobalFilter({
  preGlobalFilteredRows,
  globalFilter,
  setGlobalFilter,
}) {
  const count = preGlobalFilteredRows.length;
  const [value, setValue] = React.useState(globalFilter);
  const onChange = useAsyncDebounce((value) => {
    setGlobalFilter(value || undefined);
  }, 200);

  return (
    <FilterLabel>
      <span>Search: </span>
      <StyledMyTextInput
        type="text"
        value={value || ''}
        onChange={(e) => {
          setValue(e.target.value);
          onChange(e.target.value);
        }}
        placeholder={`${count} records...`}
      />
    </FilterLabel>
  );
}

const StyledMyTextInput = styled.input`
  margin: 10px 0px;
  padding: 5px;
  border: 1px solid lightblue;
  border-radius: 3px;
`;

const FilterLabel = styled.label`
  display: flex; // flex
  column-gap: 0.5rem; // gap-x-2
  align-items: baseline; // items-baseline

  span {
    color: rgb(55 65 81); // text-gray-700
  }
`;

const StyledSelect = styled.select`
  margin: 10px 0px;
  padding: 5px;
  padding-right: 10px;
  font-size: 15px;
  background-color: white;
  border: 1px solid lightblue;
  border-radius: 3px;
`;

function Table({ columns, data, initialState }) {
  // Use the state and functions returned from useTable to build your UI
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    prepareRow,
    state,
    preGlobalFilteredRows,
    setGlobalFilter,
  } = useTable(
    {
      columns,
      data,
      initialState,
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  // Render the UI for your table
  return (
    <>
      <GlobalFilterDiv>
        <GlobalFilter
          preGlobalFilteredRows={preGlobalFilteredRows}
          globalFilter={state.globalFilter}
          setGlobalFilter={setGlobalFilter}
        />
        {headerGroups.map((headerGroup) =>
          headerGroup.headers.map((column) =>
            column.Filter ? (
              <div key={column.id}>
                {/* <label for={column.id}>{column.render('Header')}: </label> */}
                {column.render('Filter')}
              </div>
            ) : null
          )
        )}
      </GlobalFilterDiv>
      <TableDivContainer>
        <div className="div-2">
          <div className="div-3">
            <div className="div-4">
              <table {...getTableProps()}>
                <thead>
                  {headerGroups.map((headerGroup) => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                      {headerGroup.headers.map((column) => (
                        // Add the sorting props to control sorting. For this example
                        // we can add them into the header props
                        <th
                          {...column.getHeaderProps(
                            column.getSortByToggleProps()
                          )}
                        >
                          {column.render('Header')}
                          {/* Add a sort direction indicator */}
                          <span>
                            {column.isSorted
                              ? column.isSortedDesc
                                ? ' ▼'
                                : ' ▲'
                              : ''}
                          </span>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                  {page.map((row, i) => {
                    prepareRow(row);
                    return (
                      <tr {...row.getRowProps()}>
                        {row.cells.map((cell) => {
                          return (
                            <td {...cell.getCellProps()}>
                              {cell.render('Cell')}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </TableDivContainer>
      {/* Pagination */}
      <PaginationDiv>
        {/* <PaginationButtonContainer>
          <Button onClick={() => previousPage()} disabled={!canPreviousPage}>
            Previous
          </Button>
          <Button onClick={() => nextPage()} disabled={!canNextPage}>
            Next
          </Button>
        </PaginationButtonContainer> */}
        <div className="pagination-div-2">
          <div className="pagination-div-3">
            <span className="upper-span">
              Page <span className="lower-span">{state.pageIndex + 1}</span> of{' '}
              <span className="lower-span">{pageOptions.length}</span>
            </span>
            <label>
              <span className="sr-only">Items Per Page</span>
              <StyledSelect
                value={state.pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                }}
              >
                {[5, 10, 20].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    Show {pageSize}
                  </option>
                ))}
              </StyledSelect>
            </label>
          </div>
          <div>
            <nav aria-label="Pagination">
              <PageButton
                onClick={() => gotoPage(0)}
                disabled={!canPreviousPage}
                pos="left"
              >
                <span className="sr-only">First</span>
                <ChevronDoubleLeftIcon
                  className="chevron-icon"
                  aria-hidden="true"
                />
              </PageButton>
              <PageButton
                onClick={() => previousPage()}
                disabled={!canPreviousPage}
              >
                <span className="sr-only">Previous</span>
                <ChevronLeftIcon className="chevron-icon" aria-hidden="true" />
              </PageButton>
              <PageButton onClick={() => nextPage()} disabled={!canNextPage}>
                <span className="sr-only">Next</span>
                <ChevronRightIcon className="chevron-icon" aria-hidden="true" />
              </PageButton>
              <PageButton
                onClick={() => gotoPage(pageCount - 1)}
                disabled={!canNextPage}
                pos="right"
              >
                <span className="sr-only">Last</span>
                <ChevronDoubleRightIcon
                  className="chevron-icon"
                  aria-hidden="true"
                />
              </PageButton>
            </nav>
          </div>
        </div>
      </PaginationDiv>

      {/* <div>
        <pre>
          <code>{JSON.stringify(state, null, 2)}</code>
        </pre>
      </div> */}
    </>
  );
}

export function StatusPill({ value }) {
  const status = value ? value.toLowerCase() : 'unknown';

  return <StatusPillText>{status}</StatusPillText>;
}

const StatusPillText = styled.span`
  // px-3
  padding-left: 0.75rem; /* 12px */
  padding-right: 0.75rem; /* 12px */
  // py-1
  padding-top: 0.25rem; /* 4px */
  padding-bottom: 0.25rem; /* 4px */
  text-transform: uppercase; // uppercase
  line-height: 2; // leading-wide
  font-weight: 700; // font-bold
  // text-xs
  font-size: 0.75rem; /* 12px */
  line-height: 1rem; /* 16px */
  border-radius: 9999px; // rounded-full
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); // shadow-sm
`;

export function AvatarCell({ value, column, row }) {
  return (
    <AvatarCellDiv>
      <div className="avatarCellDiv-2">
        <img
          className="h-10 w-10 rounded-full"
          src={row.original[column.imgAccessor]}
          alt=""
        />
      </div>
      <div className="avatarCellDiv-3">
        <div className="avatarCellDiv-4">{value}</div>
        <div className=".avatarCellDiv-5">
          {row.original[column.emailAccessor]}
        </div>
      </div>
    </AvatarCellDiv>
  );
}

const AvatarCellDiv = styled.div`
  display: flex; // flex
  align-items: center; // items-center
  text-transform: uppercase;

  img {
    height: 1.75rem; // h-10
    width: 1.75rem; // w-10
    border-radius: 9999px; // rounded-full
  }

  .avatarCellDiv-2 {
    flex-shrink: 0; // flex-shrink-0
    height: 1.75rem; // h-10
    width: 1.75rem; // w-10
  }

  .avatarCellDiv-3 {
    margin-left: 1rem; // ml-4
  }

  .avatarCellDiv-4 {
    // text-sm
    font-size: 0.875rem; /* 14px */
    line-height: 1.25rem; /* 20px */
    font-weight: 500; // font-medium
    color: rgb(17 24 39); // text-gray-900
  }

  .avatarCellDiv-5 {
    // text-sm
    font-size: 0.875rem; /* 14px */
    line-height: 1.25rem; /* 20px */
    color: rgb(107 114 128); // text-gray-500
  }
`;

const PaginationDiv = styled.div`
  /* padding-top: 0.75rem; 12px // py-3 */
  /* padding-bottom: 0.75rem; 12px */
  display: flex; // flex
  align-items: center; // items-center
  justify-content: space-between; // justify-between

  .pagination-div-2 {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    /* display: none; // hidden */
    // sm:flex-1 sm:flex sm:items-center sm:justify-between
  }

  .pagination-div-3 {
    display: flex; // flex
    column-gap: 0.5rem; // gap-x-2
    align-items: center;
  }

  .upper-span {
    font-size: 0.875rem; /* 14px */ // text-sm
    line-height: 1.25rem; /* 20px */
    color: rgb(55 65 81); // text-gray-700
  }

  .lower-span {
    font-weight: 500; // font-medium
  }

  nav {
    position: relative; // relative
    z-index: 0; // z-0
    display: inline-flex; // inline-flex
    border-radius: 0.375rem; // rounded-md
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); // shadow-sm
    margin-left: 1px; // -space-x-px
    border: 1px solid rgb(209 213 219);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  .chevron-icon {
    height: 1.25rem; // h-5
    width: 1.25rem; // w-5
  }
`;

const PaginationButtonContainer = styled.div`
  flex: 1 1 0%; // flex-1
  display: flex; // flex
  justify-content: space-between; // justify-between
  // sm:hidden
`;

const GlobalFilterDiv = styled.div`
  display: flex; // flex
  column-gap: 0.5rem; /* 8px */ // gap-x-2
`;

const TableDivContainer = styled.div`
  display: flex; // flex: ;
  flex-direction: column; // flex-col
  /* width: 100%; */

  .div-2 {
    overflow-x: auto; // overflow-x-auto
    // sm:-mx-6
    // lg:-mx-8
  }
  .div-3 {
    padding-top: 0.5rem; // py-2
    padding-bottom: 0.5rem; // py-2
    vertical-align: middle; // align-middle
    display: inline-block; // inline-block
    min-width: 100%; // min-w-full
    // sm:px-6
    // lg:px-8
  }
  .div-4 {
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); // shadow
    overflow: hidden; // overflow-hidden
    border-bottom-width: 1px; // border-b
    border-color: rgb(229 231 235); // border-gray-200
    // sm:rounded-lg
    border-radius: 10px;
    border: 1px solid rgb(229 231 235);
  }

  table {
    min-width: 100%; // min-w-full
    border-top-width: 0px; // divide-y
    border-bottom-width: 1px; // divide-y
    border-color: rgb(229 231 235); // divide-gray-200
    text-indent: 0;
    border-collapse: collapse;
  }

  thead {
    background-color: rgb(249 250 251); // bg-gray-50
  }

  th {
    padding-left: 1.5rem; // px-6
    padding-right: 1.5rem;
    padding-top: 0.75rem; // py-3
    padding-bottom: 0.75rem;
    text-align: left; // text-left
    font-size: 0.75rem; // text-xs
    line-height: 1rem;
    font-weight: 500; // font-medium
    color: rgb(107 114 128); // text-gray-500
    text-transform: uppercase; // uppercase
    letter-spacing: 0.05em; // tracking-wider
  }

  tbody {
    background-color: rgb(255 255 255); // bg-white
    border-top-width: 0px; // divide-y
    border-bottom-width: 1px;
    border-color: rgb(229 231 235); // divide-gray-200
  }

  td {
    padding-left: 1.5rem; /* 24px */ // px-6
    padding-right: 1.5rem; /* 24px */
    padding-top: 0.5rem; // py-4
    padding-bottom: 0.5rem;
    white-space: nowrap; // whitespace-nowrap
    color: rgb(107 114 128);
    font-weight: 300;
    text-transform: uppercase;
  }

  tr {
    border-bottom: 1px solid rgb(229 231 235);
  }
`;

export default Table;
