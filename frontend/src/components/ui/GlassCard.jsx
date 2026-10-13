export default function GlassCard({ as: Tag = 'section', className = '', children, ...rest }) {
  return (
    <Tag className={`glass ${className}`} {...rest}>
      {children}
    </Tag>
  )
}
