import React from "react";

const JsonViewPage = () => {
  return (
    <div style={{ width: "100%", height: "100vh", overflow: "auto" }}>
      <iframe
        src="https://json.wangjun.dev"
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    </div>
  );
};

export default JsonViewPage;
