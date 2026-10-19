"use client";

export function PrintButton() {
  return <button type="button" className="button button-dark" onClick={() => window.print()}><span className="material-symbols-outlined">print</span> CETAK</button>;
}
