import DepartmentPage, { departmentMetadata } from "@modules/garb/shop/department-page"

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export const generateMetadata = () => departmentMetadata("women")

export default async function Page({ searchParams }: Props) {
  return <DepartmentPage department="women" searchParams={await searchParams} />
}
