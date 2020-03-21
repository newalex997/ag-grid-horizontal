import React from "react";
import { useDispatch } from "react-redux";
import { normalizeData } from "./utils";

const PinBox = ({
  data,
  column,
  agGridReact: {
    props: { horizontalMode }
  }
}) => {
  const dispatch = useDispatch();
  const groupData = horizontalMode ? normalizeData(data, column) : data;

  if (!groupData.isGroupRow) return <div>O</div>;

  return (
    <div onClick={() => dispatch({ type: "ACTION" })} className="groupRow">
      {groupData.name}
    </div>
  );
};

export default PinBox;
