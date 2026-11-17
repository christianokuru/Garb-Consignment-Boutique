import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { seedGarb } from "../scripts/seed-garb"

/**
 * Runs once on the first `medusa db:migrate` and fills an empty database with
 * the Garb store setup and demo catalogue. Skipped when a store already exists.
 */
export default async function garbInitialSeed({ container }: { container: MedusaContainer }) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: stores } = await query.graph({ entity: "store", fields: ["id"] })
  if (stores.length) {
    return
  }
  await seedGarb(container)
}
