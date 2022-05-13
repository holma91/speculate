import React from 'react';
import {
  useTable,
  useFilters,
  useGlobalFilter,
  useAsyncDebounce,
  useSortBy,
  usePagination,
} from 'react-table';
import {
  ChevronDoubleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/react/solid';
import { Classes } from './Utils';
import { PageButton } from './Button';
import { SortIcon, SortUpIcon, SortDownIcon } from './Icons';

// Define a default UI for filtering
export const GlobalFilter = ({
  preGlobalFilteredRows,
  globalFilter,
  setGlobalFilter,
}) => {
  const count = preGlobalFilteredRows.length;
  const [value, setValue] = React.useState(globalFilter);
  const onChange = useAsyncDebounce((val) => {
    setGlobalFilter(val || undefined);
  }, 200);

  const handleChange = (event) => {
    setValue(event.target.value);
    onChange(event.target.value);
  };

  return (
    <div>
      <label htmlFor="search-input" className="flex gap-x-2 items-baseline">
        <span className="text-gray-700">search: </span>
        <input
          id="search-input"
          type="text"
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          value={value || ''}
          placeholder={`${count} records...`}
          onChange={handleChange}
        />
      </label>
    </div>
  );
};

// This is a custom filter UI for selecting
// a unique option from a list
export const SelectColumnFilter = ({
  column: { filterValue, setFilter, preFilteredRows, id, render },
}) => {
  // Calculate the options for filtering
  // using the preFilteredRows
  const options = React.useMemo(() => {
    const ops = new Set();
    preFilteredRows.forEach((row) => {
      ops.add(row.values[id]);
    });
    return [...ops.values()];
  }, [id, preFilteredRows]);

  const handleChange = (event) => {
    setFilter(event.target.value || undefined);
  };

  const Options = () =>
    options
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
      .map((option) => (
        <option className="" key={option.id} value={option}>
          {option}
        </option>
      ));

  // Render a multi-select box
  return (
    <label htmlFor="selection-field" className="flex gap-x-2 items-baseline">
      <span className="text-gray-700">{render('Header')}: </span>
      <select
        id="selection-field"
        key="selection-field"
        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        name={id}
        value={filterValue}
        onChange={handleChange}
      >
        <option value="">All</option>
        <Options />
      </select>
    </label>
  );
};

export const StatusPill = ({ value }) => {
  return (
    <span
      className={classNames(
        'px-3 py-1 uppercase leading-wide font-bold text-xs rounded-full shadow-sm',
        value > 3 ? 'bg-green-100 text-green-800' : null,
        value > 1 && value < 4 ? 'bg-yellow-100 text-yellow-800' : null,
        value < 2 ? 'bg-red-100 text-red-800' : null
      )}
    >
      {value}
    </span>
  );
};

export const StatusPillOrder = ({ value }) => {
  return (
    <span
      className={classNames(
        'py-1 uppercase leading-wide font-bold text-xs rounded-full shadow-sm',
        value === 'buy' ? 'text-green-600' : null,
        value === 'sell' ? 'text-red-600' : null
      )}
    >
      {value}
    </span>
  );
};

export const StatusPillProfit = ({ value }) => {
  return (
    <span
      className={classNames(
        'py-1 uppercase leading-wide font-bold text-xs rounded-full shadow-sm',
        parseInt(value) > 100000 ? 'text-green-700' : null,
        parseInt(value) < 100000 && parseInt(value) > 0
          ? 'text-yellow-700'
          : null,
        parseInt(value) < 0 ? 'text-red-700' : null
      )}
    >
      {value}
    </span>
  );
};

export const AvatarCell = ({ value, column, row }) => {
  return (
    <div className="flex items-center">
      <div>
        <div className="text-sm font-medium text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">
          {row.original[column.addressAccessor]}
        </div>
      </div>
    </div>
  );
};

export const PageCounter = ({ pageCurrent, pageMax }) => (
  <>
    Page <span className="font-medium">{pageCurrent}</span> of{' '}
    <span className="font-medium">{pageMax}</span>
  </>
);

export const PageSelector = ({ state, setPageSize, pageOptions }) => (
  <div className="flex gap-x-2 items-baseline">
    <span className="text-sm text-gray-700">
      <PageCounter
        pageCurrent={state.pageIndex + 1}
        pageMax={pageOptions.length}
      />
    </span>
    <label htmlFor="item-count-selector">
      <span className="sr-only">Items Per Page</span>
      <select
        id="item-count-selector"
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        value={state.pageSize}
        onChange={(e) => {
          setPageSize(Number(e.target.value));
        }}
      >
        {[5, 10, 15, 20, 25, 50].map((pageSize) => (
          <option key={pageSize} value={pageSize}>
            Show {pageSize}
          </option>
        ))}
      </select>
    </label>
  </div>
);

export const ChangePage = ({
  canPreviousPage,
  canNextPage,
  previousPage,
  nextPage,
  gotoPage,
  pageCount,
}) => (
  <div>
    <nav
      className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
      aria-label="Pagination"
    >
      <PageButton
        className="rounded-l-md"
        onClick={() => gotoPage(0)}
        disabled={!canPreviousPage}
      >
        <span className="sr-only">First</span>
        <ChevronDoubleLeftIcon
          className="h-5 w-5 text-gray-400"
          aria-hidden="true"
        />
      </PageButton>
      <PageButton onClick={() => previousPage()} disabled={!canPreviousPage}>
        <span className="sr-only">Previous</span>
        <ChevronLeftIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
      </PageButton>
      <PageButton onClick={() => nextPage()} disabled={!canNextPage}>
        <span className="sr-only">Next</span>
        <ChevronRightIcon
          className="h-5 w-5 text-gray-400"
          aria-hidden="true"
        />
      </PageButton>
      <PageButton
        className="rounded-r-md"
        onClick={() => gotoPage(pageCount - 1)}
        disabled={!canNextPage}
      >
        <span className="sr-only">Last</span>
        <ChevronDoubleRightIcon
          className="h-5 w-5 text-gray-400"
          aria-hidden="true"
        />
      </PageButton>
    </nav>
  </div>
);

const TableHeader = ({ headerGroups }) =>
  headerGroups.map((headerGroup) => (
    <tr
      {...headerGroup.getHeaderGroupProps()}
      key={Math.floor(Math.random() * 10000)}
    >
      {headerGroup.headers.map((column) => (
        // Add the sorting props to control sorting. For this example
        // we can add them into the header props
        <th
          scope="col"
          className="group px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          {...column.getHeaderProps(column.getSortByToggleProps())}
          key={Math.floor(Math.random() * 1000)}
        >
          <div className="flex items-center justify-between">
            {column.render('Header')}
            {/* Add a sort direction indicator */}
            <span>
              {column.isSorted ? (
                column.isSortedDesc ? (
                  <SortDownIcon className="w-4 h-4 text-gray-400" />
                ) : (
                  <SortUpIcon className="w-4 h-4 text-gray-400" />
                )
              ) : (
                <SortIcon className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" />
              )}
            </span>
          </div>
        </th>
      ))}
    </tr>
  ));

const TableBody = ({ page, prepareRow }) =>
  page.map((row) => {
    prepareRow(row);
    return (
      <tr {...row.getRowProps()} key={Math.floor(Math.random() * 10000)}>
        {row.cells.map((cell) => (
          <td
            {...cell.getCellProps()}
            className="px-3 py-1 whitespace-nowrap"
            role="cell"
            key={Math.floor(Math.random() * 10000)}
          >
            <div className="text-sm text-gray-500">
              {cell.column.isLink ? (
                <a href={`${cell.value}`} target="_blank">
                  to {cell.column.Header}
                </a>
              ) : (
                <>{cell.render('Cell')}</>
              )}
            </div>
          </td>
        ))}
      </tr>
    );
  });

export default function Table({ columns, data, initialState }) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,

    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,

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

  // This has been separated but needs to be rewritten
  const Headers = () =>
    headerGroups.map((headerGroup) =>
      headerGroup.headers.map((column) =>
        column.Filter ? (
          <div className="mt-2 sm:mt-0" key={column.id}>
            {column.render('Filter')}
          </div>
        ) : null
      )
    );

  return (
    <div>
      <div className="sm:flex sm:gap-x-2">
        <GlobalFilter
          preGlobalFilteredRows={preGlobalFilteredRows}
          globalFilter={state.globalFilter}
          setGlobalFilter={setGlobalFilter}
        />
        <Headers />
      </div>
      {/* table */}
      <div className="mt-4 flex flex-col">
        <div className="-my-2 overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table
                {...getTableProps()}
                className="min-w-full divide-y divide-gray-200"
              >
                <thead className="bg-gray-50">
                  <TableHeader headerGroups={headerGroups} />
                </thead>
                <tbody
                  {...getTableBodyProps()}
                  className="bg-white divide-y divide-gray-200"
                >
                  <TableBody page={page} prepareRow={prepareRow} />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {/* Pagination */}
      <div className="py-3 flex items-center justify-between">
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <PageSelector
            state={state}
            setPageSize={setPageSize}
            pageOptions={pageOptions}
          />
          <ChangePage
            canPreviousPage={canPreviousPage}
            canNextPage={canNextPage}
            previousPage={previousPage}
            nextPage={nextPage}
            gotoPage={gotoPage}
            pageCount={pageCount}
          />
        </div>
      </div>
    </div>
  );
}
