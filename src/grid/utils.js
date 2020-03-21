import { findIndex, move, set, lensProp } from "ramda";

const getFieldPrefix = field => field.split("-")[0];

const orderRowsByIndex = rows =>
  rows.sort((a, b) => ("" + a.column).localeCompare(b.column));

const getMatchingRows = (gridApi, query) => {
  const matchingCells = [];

  gridApi.api.forEachNode((node, index) => {
    const rowMatchingCells = Object.keys(node.data).reduce((acc, key) => {
      if (key.split("-")[0] === "athlete" && node.data[key].includes(query)) {
        return [...acc, { column: key, rowIndex: index, node }];
      }

      return acc;
    }, []);

    matchingCells.push(...rowMatchingCells);
  });

  return matchingCells;
};

const getHighlightRowIndex = (row, matchingRows) => {
  const orderedrows = orderRowsByIndex(matchingRows);

  return !row
    ? 0
    : findIndex(
        ({ column, rowIndex }) =>
          column === row.column && rowIndex === row.rowIndex,
        orderedrows
      );
};

const getNextHighlightRowIndex = (highlightRow, matchingRows) => {
  const highlightIndex = getHighlightRowIndex(highlightRow, matchingRows);

  return highlightIndex === -1 || highlightIndex === matchingRows.length - 1
    ? 0
    : highlightIndex + 1;
};

const getNextHighlightRow = (highlightRow, matchingRows) => {
  const nextHighlightIndex = getNextHighlightRowIndex(
    highlightRow,
    matchingRows
  );

  return matchingRows[nextHighlightIndex];
};

export const flashMatchRow = ({
  gridApi,
  highlightRow,
  setHighlightRow,
  horizontalMode
}) => query => {
  const matchingRows = getMatchingRows(gridApi, query);

  if (!matchingRows.length) {
    setHighlightRow(null);
  } else {
    const nextHighlightRow = getNextHighlightRow(highlightRow, matchingRows);
    setHighlightRow(nextHighlightRow);

    if (horizontalMode) {
      gridApi.api.ensureColumnVisible(nextHighlightRow.column);

      const groupId = nextHighlightRow.column.split("-")[1];
      const rowGroup = gridApi.columnApi.getColumnGroup(groupId);
      const rowGroupColumnFields = rowGroup.children.map(({ colId }) => colId);

      gridApi.api.flashCells({
        columns: rowGroupColumnFields,
        rowNodes: [nextHighlightRow.node]
      });
    } else {
      gridApi.api.ensureNodeVisible(nextHighlightRow.node, "middle");

      gridApi.api.flashCells({
        rowNodes: [nextHighlightRow.node]
      });
    }
  }
};

export const updatefieldInAllGroups = (gridApi, field, nextValue) => {
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

const moveColumnInAllGroups = (columnGroups, colId, toIndex) => {
  return columnGroups.reduce(
    (acc, group) => [
      ...acc,
      ...movecolumnInGroup(group.children, colId, toIndex)
    ],
    []
  );
};

export const onMoveColumn = gridApi => {
  const colId = getFieldPrefix(gridApi.column.colId);
  const colParent = gridApi.column.parent;
  const inGroupIndex = colParent.groupId * colParent.children.length;
  const toIndex = gridApi.toIndex - inGroupIndex;

  const columnGroups = gridApi.columnApi.getAllDisplayedColumnGroups();
  const nextColumns = moveColumnInAllGroups(columnGroups, colId, toIndex);

  gridApi.columnApi.setColumnState(nextColumns);
};

export const normalizeData = (data, column) => {
  const groupId = column.parent.groupId;

  return Object.keys(data).reduce((acc, key) => {
    if (key.split("-")[1] === groupId) {
      return { ...acc, [getFieldPrefix(key)]: data[key] };
    }

    return acc;
  }, {});
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

const setcolumnfieldSuffix = suffix => column =>
  set(lensProp("field"), `${column.field}-${suffix}`, column);

const getHorizontalModeBulks = (rows, columnDefs, rowsPerColumn) => ({
  rowData: spliceArray(rows, rowsPerColumn).map(bulk =>
    bulk.reduce(
      (acc, row, rowIndex) => ({
        ...acc,
        ...renameRowKeys(row, rowIndex)
      }),
      {}
    )
  ),
  columnDefs: new Array(Math.ceil(rowsPerColumn))
    .fill(null)
    .map((_, index) => ({
      groupId: index,
      marryChildren: true,
      children: columnDefs.map(setcolumnfieldSuffix(index))
    }))
});

export const getrowDataBulks = (rowData, columnDefs, horizontalMode) => {
  if (horizontalMode) {
    return getHorizontalModeBulks(rowData, columnDefs, rowData.length / 26);
  }

  return {
    rowData,
    columnDefs: [
      {
        children: columnDefs
      }
    ]
  };
};
