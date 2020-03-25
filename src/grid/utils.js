import { findIndex, move, set, lensProp, equals, indexOf } from "ramda";

const getFieldPrefix = field => field.split("-")[0];

const getMatchingRows = (gridApi, query) => {
  const matchingCells = [];

  gridApi.api.forEachNode((node, index) => {
    const rowMatchingCells = Object.keys(node.data).reduce((acc, key) => {
        if (key.split("-")[0] === "athlete" && node.data[key].includes(query)) {
        return [...acc,{highlightIndex: +key.split("-")[1] , rowIndex: index, node}];
      }

      return acc;
    }, []);
    matchingCells.push(...rowMatchingCells);
  });

  return matchingCells;
};

const getOrderedRows = matchingRows => matchingRows.sort((a, b) =>
    a.highlightIndex - b.highlightIndex
);

const params = {
  force: true,
};

const getCurrentHighlight = orderedRows => orderedRows.filter(row => {
  if(row.node.data[`highlight-${row.highlightIndex}`] === true) return true
})

export const flashMatchRow = ({
  gridApi,
}) => query => {
  const matchingRows = getMatchingRows(gridApi, query);
  
  if(matchingRows.length === 0) return
  
  const orderedRows = getOrderedRows(matchingRows)
  const currentHighlightNode = getCurrentHighlight(orderedRows)[0]

  if(!currentHighlightNode || equals(currentHighlightNode, orderedRows[orderedRows.length-1])){   
    orderedRows[0].node.setDataValue(`highlight-${orderedRows[0].highlightIndex}`, true)
  
    if(equals(currentHighlightNode, orderedRows[orderedRows.length-1])){
      orderedRows[orderedRows.length-1].node.setDataValue(`highlight-${orderedRows[orderedRows.length-1].highlightIndex}`, false)
    }
  }
  else{
    const currentIndex = indexOf(currentHighlightNode)(orderedRows)
    const nextIndex = currentIndex + 1

    orderedRows[currentIndex].node.setDataValue(`highlight-${orderedRows[currentIndex].highlightIndex}`, false)
    orderedRows[nextIndex].node.setDataValue(`highlight-${orderedRows[nextIndex].highlightIndex}`, true)
  }
  
  gridApi.api.refreshCells(params)
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
