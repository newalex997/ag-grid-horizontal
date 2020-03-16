import React from "react";
import Grid from "./grid";
import { Provider } from "react-redux";

import "./App.css";
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-balham.css";
import "ag-grid-enterprise";
import store from "./redux";

function App() {
  return (
    <Provider store={store}>
      <div className="App">
        <Grid />
      </div>
    </Provider>
  );
}

export default App;
