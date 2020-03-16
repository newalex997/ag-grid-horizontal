import React from "react";
import { useDispatch } from "react-redux";

const getFieldPrefix = field => field.split("-")[0];

const normalizeData = (data, groupId) =>
  Object.keys(data).reduce((acc, key) => {
    if (key.split("-")[1] === groupId) {
      return { ...acc, [getFieldPrefix(key)]: data[key] };
    }

    return acc;
  }, {});

const PinBox = ({ data, column }) => {
  const dispatch = useDispatch();
  const groupId = column.parent.groupId;
  const groupData = normalizeData(data, groupId);

  if (!groupData.isGroupRow) return <div />;

  return (
    <div onClick={() => dispatch({ type: "ACTION" })} className="groupRow">
      {groupData.name}
    </div>
  );
};

export default PinBox;
