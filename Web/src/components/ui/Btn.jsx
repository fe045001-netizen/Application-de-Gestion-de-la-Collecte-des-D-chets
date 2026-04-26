export default function Btn({ children, variant = "primary", ...props }) {
  const styles = {
    primary:   { background: "#0F6E56", color: "#fff", border: "none" },
    secondary: { background: "#fff", color: "#444", border: "1px solid #ddd" },
    danger:    { background: "#E24B4A", color: "#fff", border: "none" },
    warning:   { background: "#EF9F27", color: "#fff", border: "none" },
  };
  return (
    <button {...props} style={{ padding: "9px 18px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", ...styles[variant], ...props.style }}>
      {children}
    </button>
  );
}