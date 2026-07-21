import React from 'react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container flex align-center justify-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <strong>PayoutIQ</strong> &copy; {new Date().getFullYear()} &mdash; Bulk Verification & Disbursement Engine.
        </div>
        <div className="flex gap-2" style={{ fontSize: '13px' }}>
          <span>Monnify Sandbox Enabled</span>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span>Gemini Parser Connected</span>
        </div>
      </div>
    </footer>
  );
}
