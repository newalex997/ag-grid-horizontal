import React from "react";

const HighligSearch = ({ onChange }) => {
  return (
    <input
      type="text"
      onKeyDown={e => {
        if (e.keyCode === 13) {
          onChange(e.target.value);
        }
      }}
    />
  );
};

export default HighligSearch;
