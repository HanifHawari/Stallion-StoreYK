export default function Loading() {
  return (
    <div className="page-loading-overlay">
      <div className="page-loading-spinner">
        <div className="spinner-ring" />
        <img src="/images/logo/logo.png" alt="Stallion Store" className="spinner-logo-img" />
      </div>
      <p className="page-loading-text">Memuat...</p>
    </div>
  );
}
