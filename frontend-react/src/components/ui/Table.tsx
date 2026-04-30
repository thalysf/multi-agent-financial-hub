import type { ReactNode } from 'react'

type TableColumn<T> = {
  header: string
  key: string
  render: (row: T) => ReactNode
}

type TableProps<T> = {
  columns: Array<TableColumn<T>>
  rows: T[]
}

export function Table<T>({ columns, rows }: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-separate border-spacing-y-2 text-left">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                className="px-4 pb-2 text-xs font-black uppercase tracking-[0.16em] text-ink/42"
                key={column.key}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr className="table-row-hover rounded-2xl bg-white/56" key={rowIndex}>
              {columns.map((column, columnIndex) => (
                <td
                  className={`px-4 py-3 text-sm font-semibold text-ink/74 ${
                    columnIndex === 0 ? 'rounded-l-2xl' : ''
                  } ${columnIndex === columns.length - 1 ? 'rounded-r-2xl' : ''}`}
                  key={column.key}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
