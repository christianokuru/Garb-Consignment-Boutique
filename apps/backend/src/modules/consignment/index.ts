import { Module } from "@medusajs/framework/utils"
import ConsignmentModuleService from "./service"

export const CONSIGNMENT_MODULE = "consignment"

export default Module(CONSIGNMENT_MODULE, {
  service: ConsignmentModuleService,
})
