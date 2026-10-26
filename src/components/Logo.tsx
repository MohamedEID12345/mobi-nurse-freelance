/** Theme-aware logo (transparent PNGs; dark variant has light lettering). */
export function Logo({ height, width, className = '' }: { height?: number; width?: number; className?: string }) {
  const style = { height: height ? `${height}px` : undefined, width: width ? `${width}px` : undefined };
  return (
    <span className={`logo-wrap ${className}`} style={{ display: 'inline-block', ...style }}>
      <img className="logo-img for-light" src="/logo-light.png" alt="MOBI-NURSE" style={width ? { width: '100%', height: 'auto' } : undefined} />
      <img className="logo-img for-dark" src="/logo-dark.png" alt="MOBI-NURSE" style={width ? { width: '100%', height: 'auto' } : undefined} />
    </span>
  );
}
