import { MedusaService } from "@medusajs/framework/utils"
import Consignor from "./models/consignor"
import ConsignmentItem from "./models/consignment-item"
import Payout from "./models/payout"

class ConsignmentModuleService extends MedusaService({
  Consignor,
  ConsignmentItem,
  Payout,
}) {
  /**
   * Generates the next human-friendly consignor account number, e.g. "G-1042".
   */
  async nextAccountNumber(): Promise<string> {
    const [, count] = await this.listAndCountConsignors({}, { take: 1, withDeleted: true })
    return `G-${1001 + count}`
  }
}

export default ConsignmentModuleService
