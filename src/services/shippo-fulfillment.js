import { FulfillmentService } from "medusa-interfaces"
import { MedusaError } from "medusa-core-utils"
import { shippoLineItem, shippoOrder } from "../utils/formatters"

class ShippoFulfillmentService extends FulfillmentService {
  static identifier = "shippo"

  constructor(
    {
      cartService,
      eventBusService,
      orderService,
      shippoClientService,
      shippoPackerService,
      shippoRatesService,
      totalsService,
    },
    options
  ) {
    super()

    /** @private @const {CartService} */
    this.cartService_ = cartService

    /** @private @const {EventBusService} */
    this.eventBusService_ = eventBusService

    /** @private @const {OrderService} */
    this.orderService_ = orderService

    /** @private @const {ShippoClientService} */
    this.shippo_ = shippoClientService

    /** @private @const {ShippoPackerService} */
    this.shippoPackerService_ = shippoPackerService

    /** @private @const {ShippoRatesService} */
    this.shippoRatesService_ = shippoRatesService

    /** @private @const {TotalsService} */
    this.totalsService_ = totalsService

    /** @public @const {} */
    this.useClient = this.shippo_.getClient()
  }

  async getFulfillmentOptions() {
    const shippingOptions = await this.shippo_.retrieveFulfillmentOptions()
    const returnOptions = this.makeReturnOptions_(shippingOptions)
    return shippingOptions.concat(returnOptions)
  }

  async createFulfillment(
    methodData,
    fulfillmentItems,
    fromOrder,
    fulfillment
  ) {
    const fromAddress = await this.shippo_.fetchSenderAddress()

    const lineItems = await this.formatLineItems_(fulfillmentItems, fromOrder)
    lineItems.forEach((item) => {
      if (item.quantity < 1) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `${item.title} quantity: ${item.quantity}`
        )
      }
    })
    const parcelName = methodData?.parcel_template?.name ?? null

    const shippoOrder = await this.createShippoOrder_(
      fromOrder,
      fromAddress,
      lineItems,
      parcelName
    ).then(async (response) => {
      const eventType = await this.eventType_(fulfillment)

      this.eventBusService_.emit(eventType, {
        order_id: fromOrder.id,
        fulfillment_id: fulfillment.id,
        customer_id: fromOrder.customer_id,
        shippo_order: response,
      })
      return response
    })

    return {
      shippo_order_id: shippoOrder.object_id,
    }
  }

  async createShippoOrder_(order, fromAddress, lineItems, parcelName) {
    return await this.shippo_
      .createOrder(await shippoOrder(order, fromAddress, lineItems, parcelName))
      .catch((e) => {
        throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, e)
      })
  }

  async cancelFulfillment(fulfillment) {
    return Promise.resolve({})
  }

  async canCalculate(data) {
    return data.type === "LIVE_RATE"
  }

  async calculatePrice(fulfillmentOption, fulfillmentData, cart) {
    const rate = await this.shippoRatesService_
      .fetchOptionRate(cart.id, fulfillmentOption)

    this.eventBusService_.emit("shippo.calculated_shipping_method", {
      cart_id: cart.id,
      rate,
    })

    return this.shippoRatesService_.getPrice(rate)  
  }

  async createReturn(returnOrder) {
    const orderId =
      returnOrder?.swap?.order_id ||
      returnOrder?.claim_order?.order_id ||
      returnOrder.order_id

    const order = await this.orderService_.retrieve(orderId, {
      relations: ["fulfillments"],
    })
    const returnLabel = await this.retrieveReturnLabel(order)
    const eventType = await this.eventType_(returnOrder)

    this.eventBusService_.emit(eventType, {
      order: returnOrder,
      transaction: returnLabel,
    })

    if (returnLabel) {
      const { rate, tracking_url_provider, tracking_number, label_url } =
        returnLabel

      return {
        rate,
        label_url,
        tracking_url_provider,
        tracking_number,
      }
    }
    return {}
  }

  async retrieveReturnLabel(order) {
    const transaction = await this.shippo_
      .fetchOrderTransactions({ displayId: order.display_id })
      .then((transactions) => {
        const returnTransact = transactions.find((ta) => ta.is_return)

        if (returnTransact) {
          // make sure the internal order has a fulfillment related to this transaction
          const fulfillment = order.fulfillments.find(
            (fm) => fm.data.shippo_order_id === returnTransact.order.object_id
          )

          if (fulfillment) {
            delete returnTransact.address_to // not reversed, confusing...
            return returnTransact
          }
        }
        return null
      })
      .catch((e) => {
        console.error(e)
      })

    if (transaction) {
      // "other one" has eveything except label_url...
      return await this.shippo_
        .fetchTransaction(transaction.object_id)
        .then(({ label_url }) => ({ ...transaction, label_url }))
    }
    return Promise.resolve(null)
  }

  async validateOption(data) {
    return true
  }

  async validateFulfillmentData(optionData, data, cart) {
    if (optionData.is_return || !cart?.id) {
      return { ...data }
    }

    const parcel = await this.shippo_.fetchUserParcelTemplates().then(
      async (parcels) =>
        await this.shippoPackerService_
          .packBins(cart.items, parcels)
          .then((packed) => ({
            id: packed[0].object_id,
            name: packed[0].name,
          }))
    )

    return {
      ...data,
      parcel_template: parcel,
    }
  }

  async formatLineItems_(items, order) {
    if (order?.is_claim) {
      order = await this.orderService_.retrieve(order.order.id, {
        relations: [
          "region",
          "payments",
          "items",
          "discounts",
          "discounts.rule",
        ],
      })
    }

    return await Promise.all(
      items.map(
        async (item) =>
          await this.totalsService_
            .getLineItemTotals(item, order)
            .then((totals) =>
              shippoLineItem(
                item,
                totals.unit_price,
                order.region.currency_code
              )
            )
      )
    )
  }

  makeReturnOptions_(fulfillmentOptions) {
    return fulfillmentOptions
      .filter((option) => !option?.is_group)
      .map((option) => {
        return {
          ...option,
          is_return: true,
        }
      })
  }

  async eventType_(orderOrFulfill) {
    if (orderOrFulfill?.provider_id) {
      const fulfillment = orderOrFulfill

      return fulfillment.claim_order_id
        ? "shippo.replace_order_created"
        : "shippo.order_created"
    }

    const order = orderOrFulfill

    if (!order.swap_id && !order.claim_order_id) {
      return "shippo.return_requested"
    } else if (order.swap_id) {
      return "shippo.swap_created"
    } else if (order.claim_order_id) {
      const { claim_order } = order
      return `shippo.claim_${claim_order.type}_created`
    }
  }

  async retrieveCart_(id) {
    return await this.cartService_.retrieve(id, {
      select: ["subtotal"],
      relations: [
        "shipping_address",
        "items",
        "items.tax_lines",
        "items.variant",
        "items.variant.product",
        "discounts",
        "discounts.rule",
        "region",
      ],
    })
  }
}

export default ShippoFulfillmentService
