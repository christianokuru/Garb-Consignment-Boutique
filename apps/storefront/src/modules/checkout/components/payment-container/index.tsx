import { Radio as RadioGroupOption } from "@headlessui/react"
import { Text, clx } from "@modules/common/components/ui"
import React, { useContext } from "react"

import Radio from "@modules/common/components/radio"

import { getPaymentInfo, paymentDescriptions } from "@lib/constants"
import { getPaymentErrorMessage } from "@lib/util/payment-error"
import SkeletonCardDetails from "@modules/skeletons/components/skeleton-card-details"
import { PaymentElement } from "@stripe/react-stripe-js"
import { StripeContext } from "../payment-wrapper/stripe-wrapper"

type PaymentContainerProps = {
  paymentProviderId: string
  selectedPaymentOptionId: string | null
  disabled?: boolean
  children?: React.ReactNode
}

const PaymentContainer: React.FC<PaymentContainerProps> = ({
  paymentProviderId,
  selectedPaymentOptionId,
  disabled = false,
  children,
}) => {
  const paymentInfo = getPaymentInfo(paymentProviderId)
  const description = paymentDescriptions[paymentProviderId]

  return (
    <RadioGroupOption
      key={paymentProviderId}
      value={paymentProviderId}
      disabled={disabled}
      className={clx(
        "mb-2 flex cursor-pointer flex-col gap-y-2 rounded-[14px] border bg-white px-5 py-4 transition-colors",
        selectedPaymentOptionId === paymentProviderId ? "border-ink" : "border-line hover:border-[#bdbdbd]"
      )}
    >
      <div className="flex items-center justify-between ">
        <div className="flex items-center gap-x-4">
          <Radio checked={selectedPaymentOptionId === paymentProviderId} />
          <div>
            <Text className="text-body font-medium">
              {paymentInfo?.title || paymentProviderId}
            </Text>
            {description && <Text className="mt-0.5 text-label text-quiet">{description}</Text>}
          </div>
        </div>
        <span className="justify-self-end text-ink">
          {paymentInfo?.icon}
        </span>
      </div>
      {children}
    </RadioGroupOption>
  )
}

export default PaymentContainer

export const StripePaymentContainer = ({
  paymentProviderId,
  selectedPaymentOptionId,
  disabled = false,
  setError,
  setPaymentComplete,
}: Omit<PaymentContainerProps, "children"> & {
  setError: (error: string | null) => void
  setPaymentComplete: (complete: boolean) => void
}) => {
  const stripeReady = useContext(StripeContext)

  return (
    <PaymentContainer
      paymentProviderId={paymentProviderId}
      selectedPaymentOptionId={selectedPaymentOptionId}
      disabled={disabled}
    >
      {selectedPaymentOptionId === paymentProviderId &&
        (stripeReady ? (
          <div className="my-4 transition-all duration-150 ease-in-out">
            <Text className="txt-medium-plus text-ui-fg-base mb-1">
              Enter your payment details:
            </Text>
            <PaymentElement
              options={{ layout: "accordion" }}
              onChange={(e) => {
                setError(null)
                setPaymentComplete(e.complete)
              }}
              // Without a handler Stripe.js reports a failed mount as an
              // unhandled "payment Element loaderror" and the option renders
              // blank with no explanation. Surface it in the checkout's own
              // error slot instead.
              onLoadError={(e) => {
                setPaymentComplete(false)
                setError(
                  getPaymentErrorMessage(e.error) ??
                    "Could not load the payment methods."
                )
              }}
            />
          </div>
        ) : (
          <SkeletonCardDetails />
        ))}
    </PaymentContainer>
  )
}
