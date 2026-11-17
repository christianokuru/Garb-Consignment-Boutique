export default function AuthShell({ title, intro, children }: { title: React.ReactNode; intro?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="content-container grid gap-10 pb-8 pt-10 sm:pt-16 lg:grid-cols-2 lg:gap-24">
      <div>
        <h1 className="display max-w-[12ch]">{title}</h1>
        {intro && <div className="mt-5 max-w-md text-body text-[#3d3d3d]">{intro}</div>}
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
