// Loading component for route suspense (shared by the router + module registry).
const RouteLoadingFallback = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "400px",
      padding: "20px",
    }}
  >
    <div
      className="loader"
      style={{
        border: "6px solid #f3f3f3",
        borderTop: "6px solid #1677ff",
        borderRadius: "50%",
        width: 40,
        height: 40,
        animation: "spin 1s linear infinite",
      }}
    />
    <p style={{ marginTop: 16, color: "#666" }}>Loading...</p>
    <style>
      {`
@keyframes spin {
0% { transform: rotate(0deg); }
100% { transform: rotate(360deg); }
}
`}
    </style>
  </div>
);

export default RouteLoadingFallback;
