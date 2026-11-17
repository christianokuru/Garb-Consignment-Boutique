import { model } from "@medusajs/framework/utils"

const Designer = model.define("designer", {
  id: model.id({ prefix: "des" }).primaryKey(),
  name: model.text().searchable(),
  handle: model.text().unique(),
  description: model.text().nullable(),
  is_featured: model.boolean().default(false),
})

export default Designer
