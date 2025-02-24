import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../utils';
import Box from './Box';
import { Body2, Caption } from './Typography';

const Table = ({
  data = [],
  columns = [],
  pageSize = 10,
  className = '',
  rowClassName,
  getRowStatus, // Function that returns 'error' | 'warning' | 'success' | null
  onRowClick,
  sortable = true,
  pagination = true,
  emptyMessage = 'No data available'
}) => {
  const { isDark } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortConfig.direction === 'asc' 
        ? aValue - bValue 
        : bValue - aValue;
    });
  }, [data, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Sorting handlers
  const handleSort = (key) => {
    if (!sortable) return;
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Status styles
  const getStatusStyles = (status) => {
    if (!status) return '';
    return cn(
      isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50',
      status === 'success' && isDark && 'border-l-4 border-l-green-500',
      status === 'warning' && isDark && 'border-l-4 border-l-yellow-500',
      status === 'error' && isDark && 'border-l-4 border-l-red-500',
      status === 'success' && !isDark && 'hover:bg-green-50',
      status === 'warning' && !isDark && 'hover:bg-yellow-50',
      status === 'error' && !isDark && 'hover:bg-red-50'
    );
  };

  return (
    <Box 
      className={cn(
        "w-full overflow-hidden",
        isDark ? "bg-slate-900" : "bg-white",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={cn(
              "border-b",
              isDark ? "border-slate-700" : "border-slate-200"
            )}>
              {columns.map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className={cn(
                    "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                    isDark ? "text-slate-400" : "text-slate-500",
                    sortable && "cursor-pointer hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  <div className="flex items-center gap-1">
                    {label}
                    {sortable && sortConfig.key === key && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={cn(
            "divide-y",
            isDark ? "divide-slate-800" : "divide-slate-100"
          )}>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className={cn(
                    "px-6 py-4 text-center text-sm",
                    isDark ? "text-slate-400" : "text-slate-500"
                  )}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "transition-colors",
                    onRowClick && "cursor-pointer",
                    isDark ? "hover:bg-slate-800/50" : "hover:bg-slate-50",
                    getStatusStyles(getRowStatus?.(row)),
                    rowClassName
                  )}
                >
                  {columns.map(({ key, render }) => (
                    <td
                      key={key}
                      className={cn(
                        "px-6 py-4 text-sm",
                        isDark ? "text-slate-300" : "text-slate-900"
                      )}
                    >
                      {render ? render(row[key], row) : row[key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className={cn(
          "px-6 py-3 flex items-center justify-between border-t",
          isDark ? "border-slate-700" : "border-slate-200"
        )}>
          <div className={cn(
            "text-sm",
            isDark ? "text-slate-400" : "text-slate-500"
          )}>
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className={cn(
                "p-1 rounded transition-colors",
                isDark 
                  ? "hover:bg-slate-700 disabled:text-slate-700" 
                  : "hover:bg-slate-100 disabled:text-slate-300"
              )}
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(curr => Math.max(1, curr - 1))}
              disabled={currentPage === 1}
              className={cn(
                "p-1 rounded transition-colors",
                isDark 
                  ? "hover:bg-slate-700 disabled:text-slate-700" 
                  : "hover:bg-slate-100 disabled:text-slate-300"
              )}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(curr => Math.min(totalPages, curr + 1))}
              disabled={currentPage === totalPages}
              className={cn(
                "p-1 rounded transition-colors",
                isDark 
                  ? "hover:bg-slate-700 disabled:text-slate-700" 
                  : "hover:bg-slate-100 disabled:text-slate-300"
              )}
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className={cn(
                "p-1 rounded transition-colors",
                isDark 
                  ? "hover:bg-slate-700 disabled:text-slate-700" 
                  : "hover:bg-slate-100 disabled:text-slate-300"
              )}
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </Box>
  );
};

Table.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  columns: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    render: PropTypes.func
  })).isRequired,
  pageSize: PropTypes.number,
  className: PropTypes.string,
  rowClassName: PropTypes.string,
  getRowStatus: PropTypes.func,
  onRowClick: PropTypes.func,
  sortable: PropTypes.bool,
  pagination: PropTypes.bool,
  emptyMessage: PropTypes.string
};

export default Table; 