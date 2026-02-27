import React from "react";

const NodeLabel = (props) => {
  const { timeLine } = props;
  return (
    <div className="w-24">
      {timeLine.year}/{timeLine.month}/{timeLine.day}
      <div style={{ fontSize: "10px", color: "gray" }}>{timeLine.week}</div>
      {timeLine.weather?.weather && timeLine.weather?.temperature && (
        <div style={{ fontSize: "10px", color: "gray" }}>
          {timeLine.weather.weather + " " + timeLine.weather.temperature + "℃"}
        </div>
      )}
    </div>
  );
};

export default NodeLabel;
