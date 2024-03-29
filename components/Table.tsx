/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/jsx-key */
/* eslint-disable react/jsx-props-no-spreading */
import React from "react";
import { useTable, useSortBy, useGroupBy, useExpanded, useRowSelect } from "react-table";
import CurrencyInput from "react-currency-input-field";
import PoolModal from "./PoolModal";

import ReactTooltip from "react-tooltip";

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
      className="w-24 text-center input-xs input-bordered input"
      placeholder="0.00"
      step={10}
      defaultValue={value}
      allowNegativeValue={false}
      decimalsLimit={2}
      onValueChange={(value) => onChange(value ?? "0")}
      onBlur={onBlur}
    />
  );
};

// Be sure to pass our updateMyData and the skipReset option
function Table({
  columns,
  data,
  updateMyData,
  showDetails
}: {
  columns: any;
  data: any;
  updateMyData: any;
  showDetails: any;
}) {
  const defaultColumn = React.useMemo(
    () => ({
      sortDescFirst: true
    }),
    []
  );
  let prevHiddenColumns: never[] = [];
  // Use the state and functions returned from useTable to build your UI
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    footerGroups,
    prepareRow,
    rows,
    setHiddenColumns
  } = useTable(
    {
      columns,
      data,
      defaultColumn,
      initialState: {
        hiddenColumns: prevHiddenColumns
      },
      updateMyData
    } as any,
    useGroupBy,
    useSortBy,
    useExpanded,
    useRowSelect
  );

  React.useEffect(() => {
    let hiddenColumns = !showDetails ? ["poolValue", "totalShares", "dailyReward"] : [];
    setHiddenColumns(hiddenColumns);
  }, [setHiddenColumns, showDetails]);

  // Render the UI for your table
  return (
    <>
      <ReactTooltip effect="float" place="bottom" className="rounded-md tooltip-primary tooltip" />
      <table
        className="table w-full max-w-6xl mx-auto font-bold table-zebra table-compact"
        {...getTableProps()}
      >
        <thead>
          {headerGroups.map((headerGroup: any) => (
            <tr className="" {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column: any) => (
                <th {...column.getHeaderProps()}>
                  <div>
                    <span
                      data-tip={column.tip}
                      className="text-2xs"
                      {...column.getSortByToggleProps()}
                    >
                      {column.render("Header")}
                      {/* Add a sort direction indicator */}
                      {column.isSorted ? (!column.isSortedDesc ? " ▲" : " ▼") : "⬍"}
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
        <tfoot>
          {footerGroups.map((group) => (
            <tr {...group.getFooterGroupProps()}>
              {group.headers.map((column) => (
                <td {...column.getFooterProps()}>{column.render("Footer") as React.ReactNode}</td>
              ))}
            </tr>
          ))}
        </tfoot>
      </table>
    </>
  );
}

function RewardsTable(props: {
  aquaPrice: any;
  data: any;
  showDetails: boolean;
}): React.ReactElement {
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
                }
              >
                <span className="inline-block pl-1 text-xs transition-colors lg:break-normal hover:text-secondary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="inline-block w-4 h-4 align-top"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
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
        Header: "Vote %",
        Footer: "Vote %",
        tip: "Current vote percentage for pool",
        accessor: "votePercentage",
        Cell: ({ value, row }: any) => {
          return (
            <PoolModal
              voteValue={value}
              poolId={row.original.poolId}
              poolAccount={row.original.voteAccount}
            ></PoolModal>
          );
        }
      },
      {
        Header: "REWARD PER $",
        Footer: "REWARD PER $",
        accessor: "rewardPerDollar",
        Cell: ({ value }: { value: string }) => (
          <div className="text-center badge badge-outline">{value} AQUA</div>
        )
      },
      {
        Header: "REWARD PER $ (DAY)",
        Footer: "REWARD PER $ (DAY)",
        accessor: "rewardPerDollarPerDay",
        Cell: ({ value }: { value: string }) => (
          <div className="text-center badge badge-outline">{value} AQUA</div>
        )
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
        Header: "Hourly Reward",
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
              <span className="badge badge-secondary ">
                {(props.value * aquaPrice).toFixed(2) + "$"}
              </span>
            ) : null}
          </div>
        )
      },
      {
        Header: "Daily REWARD",
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
              <span className="badge badge-secondary">
                {(props.value * aquaPrice).toFixed(2) + "$"}
              </span>
            ) : null}
          </div>
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
        Cell: ({ value }: { value: string }) => <span>{"$" + parseFloat(value).toFixed(0)}</span>
      },
      {
        Header: "Daily AMM Reward",
        accessor: "dailyReward",
        Cell: ({ value }: { value: string }) => (
          <span>{parseFloat(value).toFixed(0) + " AQUA"}</span>
        ),
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
      <div className="max-h-screen overflow-y-auto text-9xl lg:max-h-full">
        <ReactTooltip
          effect="float"
          place="bottom"
          className="rounded-md tooltip-primary"
          backgroundColor="black"
        />
        <Table
          columns={columns}
          data={data}
          updateMyData={updateMyData}
          showDetails={props.showDetails}
        />
      </div>
    </>
  );
}

export default RewardsTable;
