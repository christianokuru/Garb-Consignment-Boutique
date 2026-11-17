import Link from "next/link"

export default function ProductNotFound() {
  return (
    <div className="content-container py-24 text-center sm:py-32">
      <h1 className="display mx-auto max-w-[14ch]">This piece has found a <em>new home</em>.</h1>
      <p className="mx-auto mt-5 max-w-md text-body text-[#3d3d3d]">
        Everything at Garb is one of one, so pieces sell quickly. New arrivals land every day.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/new-arrivals" className="btn btn-primary">See new arrivals</Link>
        <Link href="/designers" className="btn btn-secondary">Browse designers</Link>
      </div>
    </div>
  )
}
