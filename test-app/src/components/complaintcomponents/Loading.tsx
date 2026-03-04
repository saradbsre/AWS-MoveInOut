import React from "react";

const Loading: React.FC = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "500px",
      width: "100%",
      //background: "#f7f9fa",
    }}
  >
    <div
      style={{
        width: 48,
        height: 48,
        border: "4px solid #2705a0",
        borderTop: "4px solid transparent",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }}
    />
    <style>
      {`
        @keyframes spin {
          0% { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
        }
      `}
    </style>
  </div>
);

export default Loading;