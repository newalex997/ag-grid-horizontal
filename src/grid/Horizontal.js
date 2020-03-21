import React, { Component } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllModules } from "@ag-grid-enterprise/all-modules";
import {
  normalizeData,
  getrowDataBulks,
  updatefieldInAllGroups,
  onMoveColumn
} from "./utils";

const isFirstColumn = cell => {
  return cell.column.colId === cell.column.parent.displayedChildren[0].colId;
};

const getCellStyle = horizontalMode => cell => {
  const rowWidth = cell.column.parent.getActualWidth();

  const firstcolumn = horizontalMode ? isFirstColumn(cell) : true;

  const cellData = horizontalMode
    ? normalizeData(cell.data, cell.column)
    : cell.data;

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

class HorizontalGrid extends Component {
  columnResized = gridApi => {
    if (!gridApi.finished || !gridApi.column) return;

    updatefieldInAllGroups(gridApi, "width", gridApi.column.actualWidth);
  };

  columnVisible = gridApi => {
    if (!gridApi.column) return;

    updatefieldInAllGroups(gridApi, "hide", !gridApi.column.visible);
  };

  columnMoved = gridApi => {
    if (!gridApi.column) return;

    onMoveColumn(gridApi);
  };

  render() {
    const { rowData, columnDefs, horizontalMode } = this.props;

    const bulkGridAttributes = getrowDataBulks(
      rowData,
      columnDefs,
      horizontalMode
    );

    const defaultColDef = {
      cellStyle: getCellStyle(horizontalMode)
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
