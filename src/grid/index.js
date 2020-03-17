import React, { Component } from "react";
import HorizontalGrid from "./Horizontal";
import VerticalGrid from "./Vertical";
import { connect } from "react-redux";
import HighligSearch from "./HighligSearch";
import PinBox from "./PinBox";
import { splitEvery, flatten, findIndex } from "ramda";

class Grid extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gridApi: null,
      highlightCell: null,
      columnDefs: [
        {
          headerName: "Pin",
          field: "index",
          cellRendererFramework: PinBox,
          width: 20
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

    this.onSearchChange = this.onSearchChange.bind(this);
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
          .splice(0, 150)
          .map((el, i) => ({ ...el, index: i }));
        this.setState({ rowData: this.insertGroupRow(nextData) });
      });
  }

  onSearchChange(value) {
    const { gridApi, highlightCell } = this.state;

    const matchingCells = [];

    gridApi.api.forEachNode((node, index) => {
      const rowMatchingCells = Object.keys(node.data).reduce((acc, key) => {
        if (key.split("-")[0] === "athlete" && node.data[key].includes(value)) {
          return [...acc, { column: key, rowIndex: index, node }];
        }

        return acc;
      }, []);

      matchingCells.push(...rowMatchingCells);
    });

    if (!matchingCells.length) {
      this.setState({ highlightCell: null });
    } else {
      const orderedrows = matchingCells.sort((a, b) =>
        ("" + a.column).localeCompare(b.column)
      );
      const highlightIndex = !highlightCell
        ? -1
        : findIndex(
            ({ column, rowIndex }) =>
              column === highlightCell.column &&
              rowIndex === highlightCell.rowIndex,
            orderedrows
          );

      const nextHighlightIndex =
        highlightIndex === -1 || highlightIndex === matchingCells.length - 1
          ? 0
          : highlightIndex + 1;

      const nextHighlightCell = matchingCells[nextHighlightIndex];

      this.setState({ highlightCell: nextHighlightCell }, () => {
        gridApi.api.flashCells({
          columns: [nextHighlightCell.column],
          rowNodes: [nextHighlightCell.node]
        });

        gridApi.api.setFocusedCell(
          nextHighlightCell.rowIndex,
          nextHighlightCell.column
        );
        gridApi.api.ensureColumnVisible(nextHighlightCell.column);
      });
    }

    // const highlightIndex = rowData.findIndex(
    //   row => !row.isGroupRow && !row.highlight && row.athlete.includes(value)
    // );

    // console.log({ highlightIndex, value, gridApi });

    // if (highlightIndex !== -1) {
    //   this.setState({
    //     rowData: update(
    //       highlightIndex,
    //       { ...rowData[highlightIndex], highlight: true },
    //       rowData
    //     )
    //   });
    // }
  }

  onGridReady = gridApi => {
    this.setState({ gridApi });
  };

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
        <HighligSearch onChange={this.onSearchChange.bind(this)} />
        <Grid
          onGridReady={this.onGridReady}
          rowData={this.state.rowData}
          columnDefs={this.state.columnDefs}
        />
      </div>
    );
  }
}

const mapStateToProps = () => ({
  reduxData: "redux data"
});

export default connect(mapStateToProps, null, null, { forwardRef: true })(Grid);
