import React, { Component } from "react";
import HorizontalGrid from "./Horizontal";
import VerticalGrid from "./Vertical";
import { connect } from "react-redux";
import PinBox from "./PinBox";

import { splitEvery, flatten } from "ramda";

class Grid extends Component {
  constructor(props) {
    super(props);
    this.state = {
      columnDefs: [
        {
          headerName: "Pin",
          field: "index",
          width: 100,
          cellRendererFramework: PinBox
        },
        {
          headerName: "Name",
          field: "athlete",
          width: 150,
          resizable: true
        },
        {
          headerName: "Age",
          field: "age",
          width: 80
        },
        {
          headerName: "Country",
          field: "country",
          width: 80,
          resizable: true
        },
        {
          headerName: "Year",
          field: "year",
          width: 80
        }
      ],
      rowData: [],
      horizontalMode: true
    };
  }

  insertGroupRow = rows => {
    const bulks = splitEvery(5, rows);
    const bulksWithgroup = bulks.map((bulk, i) => [
      { isGroupRow: true, name: `Group ${i}` },
      ...bulk
    ]);

    return flatten(bulksWithgroup);
  };

  componentDidMount() {
    fetch(
      "https://raw.githubusercontent.com/ag-grid/ag-grid/master/packages/ag-grid-docs/src/olympicWinnersSmall.json"
    )
      .then(result => result.json())
      .then(rowData => {
        const nextData = rowData
          .splice(0, 500)
          .map((el, i) => ({ ...el, index: i }));
        this.setState({ rowData: this.insertGroupRow(nextData) });
      });
  }

  columnResized = gridApi => {};

  columnVisible = gridApi => {};

  render() {
    const Grid = this.state.horizontalMode ? HorizontalGrid : VerticalGrid;

    return (
      <div
        className="ag-theme-balham"
        style={{
          height: "800px",
          width: "800px"
        }}
      >
        <button
          onClick={() =>
            this.setState(prev => ({ horizontalMode: !prev.horizontalMode }))
          }
        >
          switch mode
        </button>
        <Grid
          rowData={this.state.rowData}
          columnDefs={this.state.columnDefs}
          onColumnResized={this.columnResized}
          onColumnVisible={this.columnVisible}
        />
      </div>
    );
  }
}

const mapStateToProps = () => ({
  reduxData: "redux data"
});

export default connect(mapStateToProps, null, null, { forwardRef: true })(Grid);
