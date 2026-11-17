import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import DesignerModule from "../modules/designer"

// A designer has many products; a product has one designer.
export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    isList: true,
  },
  DesignerModule.linkable.designer
)
