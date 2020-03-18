import React, { Component } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllModules } from "@ag-grid-enterprise/all-modules";
import { set, lensProp, findIndex, move } from "ramda";

const getFieldPrefix = field => field.split("-")[0];

const normalizeData = (data, groupId) =>
  Object.keys(data).reduce((acc, key) => {
    if (key.split("-")[1] === groupId) {
      return { ...acc, [getFieldPrefix(key)]: data[key] };
    }

    return acc;
  }, {});

const isFirstColumn = cell => {
  return cell.column.colId === cell.column.parent.displayedChildren[0].colId;
};

const getCellStyle = cell => {
  const firstcolumn = isFirstColumn(cell);
  const cellData = normalizeData(cell.data, cell.column.parent.groupId);
  const rowWidth = cell.column.parent.getActualWidth();

  switch (true) {
    case firstcolumn && cellData.isGroupRow:
      return {
        "z-index": 99,
        "text-align": "left",
        "border-left": "2px solid red",
        position: "absolute",
        background: "#61dafb",
        width: `${rowWidth}px`
      };

    case cellData.isGroupRow:
      return {
        background: "#61dafb"
      };
    case firstcolumn:
      return { "border-left": "2px solid red" };
    default:
      return null;
  }
};

const spliceArray = (arr, n) => {
  let numberOfArrays = Math.ceil(arr.length / n);
  const result = [];

  for (let i = 0; i < numberOfArrays; i++) {
    let constructedArray = [];

    for (let j = i; j < arr.length; ) {
      constructedArray.push(arr[j]);
      j += numberOfArrays;
    }

    result.push(constructedArray);
  }

  return result;
};

const renameRowKeys = (data, index) => {
  return Object.keys(data).reduce(
    (acc, key) => ({
      ...acc,
      [`${key}-${index}`]: data[key]
    }),
    {}
  );
};

const createDataBulks = (rows, columnDefs) => {
  const dataBulks = spliceArray(rows, rows.length / 26);

  return {
    rowData: dataBulks.map(bulk =>
      bulk.reduce(
        (acc, row, rowIndex) => ({
          ...acc,
          ...renameRowKeys(row, rowIndex)
        }),
        {}
      )
    ),
    columnDefs: new Array(Math.ceil(rows.length / 26))
      .fill(null)
      .map((_, index) => ({
        groupId: index,
        marryChildren: true,
        children: columnDefs.map(column =>
          set(lensProp("field"), `${column.field}-${index}`, column)
        )
      }))
  };
};

const updateAllSomeFields = (gridApi, field, nextValue) => {
  const colId = getFieldPrefix(gridApi.column.colId);
  const columnState = gridApi.columnApi.getColumnState();

  const nextColumns = columnState.map(column => ({
    ...column,
    [field]: getFieldPrefix(column.colId) === colId ? nextValue : column[field]
  }));

  gridApi.columnApi.setColumnState(nextColumns);
};

const movecolumnInGroup = (allcolumns, field, toIndex) => {
  const fromIndex = findIndex(
    column => getFieldPrefix(column.colId) === field,
    allcolumns
  );

  return move(fromIndex, toIndex, allcolumns);
};

class HorizontalGrid extends Component {
  columnResized = gridApi => {
    if (!gridApi.finished || !gridApi.column) return;

    updateAllSomeFields(gridApi, "width", gridApi.column.actualWidth);
  };

  columnVisible = gridApi => {
    if (!gridApi.column) return;

    updateAllSomeFields(gridApi, "hide", !gridApi.column.visible);
  };

  columnMoved = gridApi => {
    if (!gridApi.column) return;

    const colId = getFieldPrefix(gridApi.column.colId);
    const colParent = gridApi.column.parent;
    const inGroupIndex = colParent.groupId * colParent.children.length;
    const toIndex = gridApi.toIndex - inGroupIndex;

    const groupState = gridApi.columnApi.getAllDisplayedColumnGroups();

    const nextColumns = groupState.reduce(
      (acc, group) => [
        ...acc,
        ...movecolumnInGroup(group.children, colId, toIndex)
      ],
      []
    );

    gridApi.columnApi.setColumnState(nextColumns);
  };

  render() {
    const { rowData, columnDefs } = this.props;

    const bulkGridAttributes = createDataBulks(rowData, columnDefs);

    const defaultColDef = {
      cellStyle: getCellStyle
    };

    return (
      <AgGridReact
        {...this.props}
        {...bulkGridAttributes}
        modules={AllModules}
        groupHeaderHeight={0}
        onColumnResized={this.columnResized}
        onColumnVisible={this.columnVisible}
        onColumnMoved={this.columnMoved}
        defaultColDef={defaultColDef}
      />
    );
  }
}

export default HorizontalGrid;
