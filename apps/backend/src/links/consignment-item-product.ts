import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import ConsignmentModule from "../modules/consignment"

// Each consigned piece is one product in the catalogue.
export default defineLink(
  ConsignmentModule.linkable.consignmentItem,
  ProductModule.linkable.product
)
