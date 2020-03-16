import React, { Component } from "react";
import { AgGridReact } from "ag-grid-react";

class Vertical extends Component {
  render() {
    return <AgGridReact {...this.props} />;
  }
}

export default Vertical;
