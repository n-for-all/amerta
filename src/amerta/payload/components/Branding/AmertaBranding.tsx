import React from "react";

export const AmertaBranding: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "12px",
        fontWeight: "bold",
        color: "var(--theme-elevation-800)",
      }}
    >
      <a href="https://github.com/n-for-all/amerta" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: "5px", border: "1px solid #eee", borderRadius: "4px", padding: "2px 4px" }}>
        <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
        </svg>
        <span>Amerta</span>
      </a>
      <a href="https://amerta.io" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit", height:"100%", display: "flex", alignItems: "center", gap: "5px", border: "1px solid #eee", borderRadius: "4px", padding: "2px 4px" }}>
        <svg height="14" width="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 2.00001L11.75 12.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /> 
          <path d="M21.9998 6.49999L21.9998 1.99999L17.0568 1.99999" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />{" "}
          <path d="M11 2H4C2.89543 2 2 2.89543 2 4V20C2 21.1046 2.89543 22 4 22H20C21.1046 22 22 21.1046 22 20V12.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </div>
  );
};
