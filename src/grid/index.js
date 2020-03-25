import React, { Component } from "react";
import HorizontalGrid from "./Horizontal";
import { connect } from "react-redux";
import HighligSearch from "./HighligSearch";
import PinBox from "./PinBox";
import { splitEvery, flatten } from "ramda";
import { flashMatchRow } from "./utils";

const cellStyle = function(params) {
  const number = params.colDef.field.split('-')[1]
  const highlight = params.data[`highlight-${number}`]
  
  if (highlight){
      return { backgroundColor: '#59d983'}
  }
  
  return {
    backgroundColor: 'white',
  };  
}

class Grid extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gridApi: null,
      highlightRow: null,
      columnDefs: [
        {
          headerName: "Pin",
          field: "pin",
          cellRendererFramework: PinBox,
          width: 20,
        },
        {
          headerName: "Index",
          field: "index",
          width: 100,
          resizable: true,
          cellStyle,
        },
        {
          headerName: "Name",
          field: "athlete",
          width: 150,
          resizable: true,
          cellStyle,
        },
        {
          headerName: "Age",
          field: "age",
          width: 80,
          cellStyle,
        },
        {
          headerName: "Country",
          field: "country",
          width: 80,
          resizable: true,
          cellStyle,
        },
        {
          headerName: "Year",
          field: "year",
          width: 80,
          cellStyle,
        },
        {
          headerName: "Highlight",
          field: "highlight",
          highlight: false,
          hide: true,
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
          .splice(0, 2000)
          .map((el, i) => ({ ...el, index: i }));
        this.setState({ rowData: this.insertGroupRow(nextData) });
      });
  }

  onGridReady = gridApi => {
    this.setState({ gridApi });
  };

  setHighlightRow = highlightRow => {
    this.setState({ highlightRow });
  };

  render() {
    const { gridApi, highlightRow, horizontalMode } = this.state;

    return (
      <div
        className="ag-theme-balham"
        style={{
          height: "790px",
          width: "1200px"
        }}
      >
        <button
          onClick={() =>
            this.setState(prev => ({ horizontalMode: !prev.horizontalMode }))
          }
        >
          switch mode
        </button>
        <HighligSearch
          onChange={flashMatchRow({
            gridApi,
            highlightRow,
            horizontalMode,
            setHighlightRow: this.setHighlightRow
          })}
        />
        <HorizontalGrid
          onGridReady={this.onGridReady}
          rowData={this.state.rowData}
          columnDefs={this.state.columnDefs}
          horizontalMode={this.state.horizontalMode}
        />
      </div>
    );
  }
}

const mapStateToProps = () => ({
  reduxData: "redux data"
});

export default connect(mapStateToProps, null, null, { forwardRef: true })(Grid);
