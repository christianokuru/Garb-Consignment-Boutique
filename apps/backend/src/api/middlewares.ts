import {
  allowFields,
  authenticate,
  configureStoreSearch,
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import {
  AdminCreateConsignor,
  AdminGeneratePayouts,
  AdminItemAction,
  AdminMarkPayoutPaid,
  AdminProductGarb,
  AdminUpdateAppointment,
  AdminUpdateConsignor,
  AdminUpdateDesigner,
  AdminUpsertDesigner,
  ConsignorActivate,
  ConsignorUpdateMe,
  StoreCreateAppointment,
} from "./validators"

export default defineMiddlewares({
  routes: [
    {
      // The product index declares filterable `status` and `sales_channel_ids`,
      // so the route narrows it to published products in the key's sales channels.
      method: ["POST"],
      matcher: "/store/search",
      middlewares: [configureStoreSearch({ allowed_indexes: { product: true } })],
    },
    {
      // Lets the storefront ask for the linked designer with ?fields=designer.name.
      matcher: "/store/products*",
      middlewares: [allowFields("designer.id", "designer.name", "designer.handle")],
    },
    {
      method: ["POST"],
      matcher: "/store/appointments",
      middlewares: [validateAndTransformBody(StoreCreateAppointment)],
    },

    // Seller portal. A seller registers through /auth/consignor/emailpass/register,
    // then activates with the invite token to link the login to their account.
    {
      method: ["POST"],
      matcher: "/consignors/activate",
      middlewares: [
        authenticate("consignor", ["bearer"], { allowUnregistered: true }),
        validateAndTransformBody(ConsignorActivate),
      ],
    },
    {
      matcher: "/consignors/me*",
      middlewares: [authenticate("consignor", ["bearer", "session"])],
    },
    {
      method: ["POST"],
      matcher: "/consignors/me",
      middlewares: [validateAndTransformBody(ConsignorUpdateMe)],
    },

    // Admin
    { method: ["POST"], matcher: "/admin/consignors", middlewares: [validateAndTransformBody(AdminCreateConsignor)] },
    { method: ["POST"], matcher: "/admin/consignors/:id", middlewares: [validateAndTransformBody(AdminUpdateConsignor)] },
    { method: ["POST"], matcher: "/admin/designers", middlewares: [validateAndTransformBody(AdminUpsertDesigner)] },
    { method: ["POST"], matcher: "/admin/designers/:id", middlewares: [validateAndTransformBody(AdminUpdateDesigner)] },
    { method: ["POST"], matcher: "/admin/products/:id/garb", middlewares: [validateAndTransformBody(AdminProductGarb)] },
    {
      method: ["POST"],
      matcher: "/admin/consignment-items/:id/actions",
      middlewares: [validateAndTransformBody(AdminItemAction)],
    },
    { method: ["POST"], matcher: "/admin/payouts/generate", middlewares: [validateAndTransformBody(AdminGeneratePayouts)] },
    {
      method: ["POST"],
      matcher: "/admin/payouts/:id/mark-paid",
      middlewares: [validateAndTransformBody(AdminMarkPayoutPaid)],
    },
    {
      method: ["POST"],
      matcher: "/admin/appointments/:id",
      middlewares: [validateAndTransformBody(AdminUpdateAppointment)],
    },
  ],
})
