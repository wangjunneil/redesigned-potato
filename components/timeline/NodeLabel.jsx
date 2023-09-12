import React from "react";

const NodeLabel = (props) => {
  const { timeLine } = props;
  return (
    <div>
      {timeLine.year}/{timeLine.month}/{timeLine.day}
      <div style={{ color: "gray", fontSize: "8px" }}>{timeLine.week}</div>
    </div>
  );
};

export default NodeLabel;
