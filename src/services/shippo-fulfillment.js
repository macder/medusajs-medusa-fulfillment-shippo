import { FulfillmentService } from "medusa-interfaces"
import { humanizeAmount, MedusaError } from "medusa-core-utils"
import shippo from "shippo"

// TODO: move to medusa-config plugins array
const SHIPPO_API_KEY = process.env.SHIPPO_API_KEY 
const WEIGHT_UNIT_TYPE = 'g'
const DIMENSION_UNIT_TYPE = 'cm'

class ShippoFulfillmentService extends FulfillmentService {
  static identifier = 'shippo'

  constructor({
    addressRepository,
    cartService,
    totalsService }, options) {
    super()

    /** @private @const {AddressRepository} */
    this.addressRepository_ = addressRepository

    /** @private @const {CartService} */
    this.cartService_ = cartService

    /** @private @const {Shippo} */
    this.shippo_ = shippo(SHIPPO_API_KEY)

    /** @private @const {TotalsService} */
    this.totalsService_ = totalsService
  }

  async getFulfillmentOptions() {
    const carriers = await this.shippo_.carrieraccount.list({ service_levels: true, results: 100 })
    const groups = await this.shippo_.servicegroups.list()

    const services = carriers.results
      .filter(e => e.active)
      .flatMap(item => item.service_levels
        .map(e => {
          const { service_levels, ...shippingOption } = {
            id: `shippo-fulfillment-${e.token}`,
            name: `${item.carrier_name} ${e.name}`,
            is_group: false,
            ...item
          }
          return shippingOption
        })
      )

    const serviceGroups = groups.map(e => ({
      id: `shippo-fulfillment-${e.object_id}`,
      is_group: true,
      ...e
    }))

    return [...services, ...serviceGroups]
  }

  async validateOption(data) {
    return true
  }

  async validateFulfillmentData(optionData, data, cart) {
    const { shipping_address: shippingAddress } = await this.cartService_.retrieve(cart.id, {
      relations: ["shipping_address"],
    })

    const shippoAddressId = await this.createShippoAddress(shippingAddress, cart.email)
      .then(r => {
        if (r.country == 'US') { // shippo address validation is free for only USA addresses
          if (!r.validation_results.is_valid) {
            throw r.validation_results.messages[0]
          }
        }
        return r.object_id
      }).catch(e => {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, e.text, e.code)
      })

    return {
      shippo_address_id: shippoAddressId,
      ...data
    }
  }

  async createFulfillment(
    methodData,
    fulfillmentItems,
    fromOrder,
    fulfillment
  ) {
    const toAddress = await this.createShippoAddress(fromOrder.shipping_address, fromOrder.email)
    
    const lineItems = await Promise.all(
      fulfillmentItems.map(async item => {
        const totals = await this.totalsService_.getLineItemTotals(
          item,
          fromOrder,
          {
            include_tax: true,
            use_tax_lines: true,
          }
        )

        return {
          quantity: item.quantity,
          sku: item.variant.sku,
          title: item.variant.product.title,
          total_price:
            humanizeAmount(
              totals.subtotal,
              fromOrder.currency_code
            ),
          currency: fromOrder.currency_code,
          weight: item.variant.weight,
          weight_unit: WEIGHT_UNIT_TYPE
        }
      })
    )

    const totalWeight = lineItems
      .map(e => e.weight * e.quantity)
      .reduce((sum, current) => sum + current, 0)

    const shippoOrder = await this.shippo_.order.create({
      to_address: toAddress.object_id,
      line_items: lineItems,
      placed_at: fromOrder.created_at,
      shipping_cost: humanizeAmount(
        fromOrder.shipping_methods[0].price,
        fromOrder.currency_code
      ),
      shipping_cost_currency: fromOrder.currency_code,
      shipping_method: fromOrder.shipping_methods[0].shipping_option.name,
      weight: totalWeight,
      weight_unit: WEIGHT_UNIT_TYPE
    })

  }

  canCalculate(data) {
    return true
  }

  async calculatePrice(fulfillmentOption, fulfillmentData, cart) {
    return 2000 // testing...
  }

  async createShippoAddress(address, email) {
    return await this.shippo_.address.create({
      "name": `${address.first_name} ${address.last_name}`,
      "company": address.company,
      "street1": address.address_1,
      "street2": address?.address_2,
      "street3": address?.address_3,
      "city": address.city,
      "state": address.province,
      "zip": address.postal_code,
      "country": address.country_code, // iso2 country code
      "phone": address.phone,
      "email": email,
      "validate": (address.country_code == 'us') ?? true,
    })
  }
}

export default ShippoFulfillmentService;
