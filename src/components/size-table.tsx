import type { SizeChart } from "@/lib/size-guide";

export function SizeTable({ chart, highlight = [] }: { chart: SizeChart; highlight?: string[] }) {
  return <div className="size-table-wrap">
    <table className="size-table">
      <caption className="sr-only">Konversi ukuran {chart.label}</caption>
      <thead><tr><th scope="col">US PRIA</th><th scope="col">US WANITA</th><th scope="col">UK</th><th scope="col">EU</th><th scope="col">CM</th></tr></thead>
      <tbody>{chart.rows.map((row) => <tr key={row.usM} className={highlight.includes(row.eu) ? "is-available" : undefined}>
        <td>{row.usM}</td><td>{row.usW}</td><td>{row.uk}</td><th scope="row">{row.eu}</th><td>{row.cm}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}
