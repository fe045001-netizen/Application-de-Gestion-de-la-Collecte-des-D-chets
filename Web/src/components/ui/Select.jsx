export default function Select({ label, children, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#444", marginBottom: 6 }}>
          {label}
        </label>
      )}
      <select
        {...props}
        style={{
          width: "100%", padding: "10px 14px",
          border: "1.5px solid #e0e0e0", borderRadius: 10,
          fontSize: 14, outline: "none", boxSizing: "border-box",
          background: "#fff", ...props.style,
        }}
      >
        {children}
      </select>
    </div>
  );
}
