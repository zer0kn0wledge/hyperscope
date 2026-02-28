import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: string;
}

export function PageContainer({ children, className, maxWidth = '1400px' }: PageContainerProps) {
  return (
    <div
      className={className}
      style={{
        padding: '1.5rem 2rem',
        maxWidth,
        margin: '0 auto',
        width: '100%',
        minHeight: '100vh',
      }}
    >
      {children}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e8e8e8', margin: '0 0 0.2rem', letterSpacing: '-0.01em', fontFamily: 'Inter, sans-serif' }}>{title}</h2>
        {subtitle && <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', margin: 0, fontFamily: 'Inter, sans-serif' }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
