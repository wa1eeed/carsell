import { Construction } from 'lucide-react'

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-cl-primary">{title}</h1>
      <div className="cl-card flex flex-col items-center justify-center text-center gap-3 py-16">
        <Construction size={40} className="text-cl-accent" />
        <p className="text-cl-gray-600">قريباً</p>
      </div>
    </div>
  )
}
