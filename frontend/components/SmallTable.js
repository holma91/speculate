import React from 'react';
import { useTable, useFilters, useSortBy, usePagination } from 'react-table';
import styled from 'styled-components';
import {
  ChevronDoubleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/react/solid';
import { PageButton } from '../components/Button';

function SmallTable({
  columns,
  data,
  initialState,
  clickedPosition,
  onClickedPosition,
}) {
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
  } = useTable(
    {
      columns,
      data,
      initialState,
    },
    useFilters,
    useSortBy,
    usePagination
  );

  return (
    <>
      <TableDivContainer>
        <div className="div-2">
          <div className="div-3">
            <div className="div-4">
              <table {...getTableProps()}>
                <thead>
                  {headerGroups.map((headerGroup) => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                      {headerGroup.headers.map((column) => (
                        <th
                          {...column.getHeaderProps(
                            column.getSortByToggleProps()
                          )}
                        >
                          {column.render('Header')}
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
                      <tr
                        {...row.getRowProps()}
                        onClick={() => onClickedPosition(row.original)}
                      >
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
      <PaginationDiv>
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
    </>
  );
}

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

const StyledSelect = styled.select`
  margin: 10px 0px;
  padding: 5px;
  padding-right: 10px;
  font-size: 15px;
  background-color: white;
  border: 1px solid lightblue;
  border-radius: 3px;
`;

const TableDivContainer = styled.div`
  display: flex; // flex: ;
  flex-direction: column; // flex-col

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
  }

  tr {
    border-bottom: 1px solid rgb(229 231 235);
    cursor: pointer;

    :hover {
      background-color: rgb(249 250 251);
    }
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
export default SmallTable;
