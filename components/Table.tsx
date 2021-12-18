/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/jsx-key */
/* eslint-disable react/jsx-props-no-spreading */
import React from "react";
import { useTable, useSortBy, useGroupBy, useExpanded, useRowSelect } from "react-table";
import CurrencyInput from "react-currency-input-field";

// Create an editable cell renderer
const EditableCell = ({
  value: initialValue,
  row: { index },
  row: row,
  updateMyData, // This is a custom function that we supplied to our table instance
  editable
}: any) => {
  // We need to keep and update the state of the cell normally
  const [value, setValue] = React.useState(initialValue);

  const onChange = (e: string) => {
    setValue(e);
  };

  // We'll only update the external data when the input is blurred
  const onBlur = () => {
    const delta = value - row.values.totalValueInvested;
    //const newPoolValue = delta + row.values.poolValue;

    const rewardPerHour = ((value / (delta + row.values.poolValue)) * row.values.dailyReward) / 24;
    updateMyData(index, "totalValueInvested", value);
    updateMyData(index, "rewardPerHour", rewardPerHour);
    updateMyData(index, "rewardPerHourUSD", value * row.values.rewardPerDollar);
    updateMyData(index, "rewardPerDayUSD", value * row.values.rewardPerDollar * 24);
  };

  // If the initialValue is changed externall, sync it up with our state
  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  if (!editable) {
    return `${initialValue}`;
  }

  return (
    <CurrencyInput
      id="value-input"
      name="value-input"
      prefix="$"
      className="text-center input-xs input-bordered input"
      placeholder="Please enter a number"
      defaultValue={value}
      decimalsLimit={2}
      onValueChange={(value) => onChange(value ?? "0")}
      onBlur={onBlur}
    />
  );
};

// Be sure to pass our updateMyData and the skipReset option
function Table({ columns, data, updateMyData }: { columns: any; data: any; updateMyData: any }) {
  const defaultColumn = React.useMemo(
    () => ({
      sortDescFirst: true
    }),
    []
  );

  // Use the state and functions returned from useTable to build your UI
  const { getTableProps, getTableBodyProps, headerGroups, footerGroups, prepareRow, rows } =
    useTable(
      {
        columns,
        data,
        defaultColumn,
        updateMyData
      } as any,
      useGroupBy,
      useSortBy,
      useExpanded,
      useRowSelect
    );

  // Render the UI for your table
  return (
    <>
      <table
        className="table w-full max-w-6xl mx-auto font-bold table-zebra table-compact"
        {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup: any) => (
            <tr className="text-primary" {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column: any) => (
                <th {...column.getHeaderProps()}>
                  <div>
                    <span {...column.getSortByToggleProps()}>
                      {column.render("Header")}
                      {/* Add a sort direction indicator */}
                      {column.isSorted ? (!column.isSortedDesc ? " ▲" : " ▼") : ""}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row) => {
            prepareRow(row);
            return (
              <tr className="text-sm hover" {...row.getRowProps()}>
                {row.cells.map((cell: any) => {
                  return (
                    <td {...cell.getCellProps()}>
                      {cell.isGrouped ? (
                        // If it's a grouped cell, add an expander and row count
                        <>
                          <span></span> {cell.render("Cell", { editable: false })} (
                          {row.subRows.length})
                        </>
                      ) : cell.isAggregated ? (
                        // If the cell is aggregated, use the Aggregated
                        // renderer for cell
                        cell.render("Aggregated")
                      ) : cell.isPlaceholder ? null : ( // For cells with repeated values, render null
                        // Otherwise, just render the regular cell
                        cell.render("Cell", { editable: true })
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
        <tfoot className="text-primary">
          {footerGroups.map((group) => (
            <tr {...group.getFooterGroupProps()}>
              {group.headers.map((column) => (
                <td {...column.getFooterProps()}>{column.render("Footer")}</td>
              ))}
            </tr>
          ))}
        </tfoot>
      </table>
    </>
  );
}

function RewardsTable(props: { aquaPrice: any; data: any }): React.ReactElement {
  const [aquaPrice] = React.useState(() => props.aquaPrice);
  const columns = React.useMemo(
    () => [
      {
        Header: "Pair",
        Footer: "Pair",
        accessor: "displayName",
        Cell: ({ value, row }: any) => (
          <div>
            <span className="badge badge-primary">
              {value}
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={
                  "https://stellar.expert/explorer/public/liquidity-pool/" + row.original.poolId
                }>
                <span className="inline-block pl-1 text-xs transition-colors lg:break-normal hover:text-secondary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="inline-block w-4 h-4 align-top"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </span>
              </a>
            </span>
          </div>
        )
      },
      {
        Header: "REWARD PER $",
        Footer: "REWARD PER $",
        accessor: "rewardPerDollar",
        Cell: ({ value }: { value: string }) => (
          <span className="text-right badge badge-primary badge-outline">{value} AQUA</span>
        )
      },
      {
        Header: "REWARD PER $ (DAY)",
        Footer: "REWARD PER $ (DAY)",
        accessor: "rewardPerDollarPerDay",
        Cell: ({ value }: { value: string }) => (
          <span className="text-right badge badge-primary badge-outline">{value} AQUA</span>
        )
      },
      {
        Header: "Total Shares",
        Footer: "Total Shares",
        accessor: "totalShares",
        Cell: ({ value }: { value: string }) => <span>{parseFloat(value).toFixed(0)}</span>
      },
      {
        Header: "Pool Value",
        Footer: "Pool Value",
        accessor: "poolValue",
        Cell: ({ value }: { value: string }) => <span>{parseFloat(value).toFixed(0)}</span>
      },
      {
        Header: "Daily AMM Reward",
        accessor: "dailyReward",
        Footer: (info: { rows: any[] }) => {
          // Only calculate total visits if rows change
          const total = React.useMemo(
            () =>
              info.rows.reduce(
                (sum: any, row: { values: { dailyReward: any } }) => row.values.dailyReward + sum,
                0
              ),
            [info.rows]
          );

          return <>Total: {total}</>;
        }
      },
      {
        Header: "TOTAL VALUE INVESTED",
        Footer: (info: { rows: any[] }) => {
          const total = React.useMemo(
            () =>
              info.rows.reduce(
                (sum: number, row: { values: { totalValueInvested: string } }) =>
                  parseFloat(row.values.totalValueInvested) + sum,
                0
              ),
            [info.rows]
          );

          return <>Total: {parseFloat(total).toFixed(2) + "$"}</>;
        },
        accessor: "totalValueInvested",
        Cell: EditableCell
      },
      {
        Header: "REWARD PER HOUR",

        accessor: "rewardPerHour",
        Footer: (info3: { rows: any[] }) => {
          // Only calculate total visits if rows change
          const total = React.useMemo(
            () =>
              info3.rows.reduce(
                (sum: number, row: { values: { rewardPerHour: string } }) =>
                  parseFloat(row.values.rewardPerHour) + sum,
                0
              ),
            [info3.rows]
          );

          return <>Total: {total.toFixed(2) + " AQUA"}</>;
        },
        Cell: (props: { value: any }) => (
          <div>
            {props.value ? (
              <span className="badge badge-primary">
                {(props.value ? props.value : 0).toFixed(2) + " AQUA"}
              </span>
            ) : null}
          </div>
        )
      },
      {
        Header: "REWARD PER HOUR (USD)",
        accessor: "rewardPerHourUSD",
        Footer: (info: { rows: any[] }) => {
          const total = React.useMemo(
            () =>
              info.rows.reduce(
                (sum: any, row: { values: { rewardPerHourUSD: any } }) =>
                  row.values.rewardPerHourUSD + sum,
                0
              ),
            [info.rows]
          );

          return <>Total: {(total * aquaPrice).toFixed(2) + "$"}</>;
        },
        Cell: (props: { value: number }) => (
          <div>
            {props.value ? (
              <span className="badge badge-primary badge-outline">
                {(props.value * aquaPrice).toFixed(2) + "$"}
              </span>
            ) : null}
          </div>
        )
      },
      {
        Header: "REWARD PER Day (USD)",
        accessor: "rewardPerDayUSD",
        Footer: (info: { rows: any[] }) => {
          const total = React.useMemo(
            () =>
              info.rows.reduce(
                (sum: any, row: { values: { rewardPerDayUSD: any } }) =>
                  row.values.rewardPerDayUSD + sum,
                0
              ),
            [info.rows]
          );

          return <>Total: {(total * aquaPrice).toFixed(2) + "$"}</>;
        },
        Cell: (props: { value: number }) => (
          <div>
            {props.value ? (
              <span className="badge badge-primary badge-outline">
                {(props.value * aquaPrice).toFixed(2) + "$"}
              </span>
            ) : null}
          </div>
        )
      }
    ],
    [aquaPrice]
  );

  const [data, setData] = React.useState(() => props.data);

  // When our cell renderer calls updateMyData, we'll use
  // the rowIndex, columnId and new value to update the
  // original data
  const updateMyData = (rowIndex: number, columnId: any, value: any) => {
    // We also turn on the flag to not reset the page

    setData((old: any[]) =>
      old.map((row: any, index: number) => {
        if (index === rowIndex) {
          return {
            ...old[rowIndex],
            [columnId]: value
          };
        }
        return row;
      })
    );
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table columns={columns} data={data} updateMyData={updateMyData} />
      </div>
    </>
  );
}

export default RewardsTable;
