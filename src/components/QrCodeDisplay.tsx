import { QRCodeCanvas } from 'qrcode.react'

export function QrCodeDisplay({ value, label }: { value: string; label?: string }) {
  return (
    <div className="qr-code-box">
      <QRCodeCanvas value={value} size={180} includeMargin />
      {label && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</div>}
    </div>
  )
}
