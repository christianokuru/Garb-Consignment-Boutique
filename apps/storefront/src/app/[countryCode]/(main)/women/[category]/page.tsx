import DepartmentPage, { departmentMetadata } from "@modules/garb/shop/department-page"

type Props = {
  params: Promise<{ category: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props) {
  return departmentMetadata("women", (await params).category)
}

export default async function Page({ params, searchParams }: Props) {
  return <DepartmentPage department="women" slug={(await params).category} searchParams={await searchParams} />
}
