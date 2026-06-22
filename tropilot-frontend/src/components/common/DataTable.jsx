import EmptyState from './EmptyState.jsx';

function getRowKey(row, index, rowKey) {
  if (typeof rowKey === 'function') {
    return rowKey(row, index);
  }

  return row?.[rowKey] ?? index;
}

export default function DataTable({
  columns = [],
  rows = [],
  rowKey = 'id',
  emptyMessage,
  className = '',
  tableClassName = '',
  caption,
  rowClassName,
}) {
  const isEmpty = rows.length === 0;
  const wrapperClasses = ['table-wrap', isEmpty ? 'table-wrap-empty' : '', className].filter(Boolean).join(' ');
  const tableClasses = ['data-table', tableClassName].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses}>
      <table className={tableClasses}>
        {caption && <caption className="visually-hidden">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((column) => (
              <th className={column.headerClassName} key={column.key} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              className={typeof rowClassName === 'function' ? rowClassName(row, index) : rowClassName}
              key={getRowKey(row, index, rowKey)}
            >
              {columns.map((column) => (
                <td className={column.cellClassName} key={column.key}>
                  {column.render ? column.render(row, index) : row?.[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {isEmpty && emptyMessage && <EmptyState flat className="table-empty-state" message={emptyMessage} />}
    </div>
  );
}
