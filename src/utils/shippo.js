import path from "path"
import { getConfigFile, humanizeAmount } from "medusa-core-utils"
import shippo from "shippo"

const { configModule } = getConfigFile(path.resolve("."), "medusa-config")
const { plugins } = configModule
const { options } = plugins.find(e => e.resolve === 'medusa-fulfillment-shippo')

const client = shippo(options.api_key)

/** Get shippo live rates for carts shipping options
 * @param {object} toAddress - shippo to_address object
 * @param {array} lineItems - array of cart item objects
 * @param {array} shippingOptions - array of shipping_option objects
 * @return {array} array filtered for cart of shippo live-rates objects
 */
export const shippoRates = async (toAddress, lineItems, shippingOptions) =>
  await client.liverates.create({
    address_to: toAddress,
    line_items: lineItems
  }).then(
    response => response.results
      .filter(
        item => shippingOptions
          .find(
            option => (option.data.name === item.title) && true
          )
      )
  )

export const shippoGetOrder = async (shippoOrderID) =>
  await client.order.retrieve(shippoOrderID)

export const shippoGetPackingSlip = async(shippoOrderID) =>
  await client.order.packingslip(shippoOrderID)

/** Get a flat product object from LineItem
 * @param {LineItem} - LineItem object
 * @return {object} - flat product
 */
export const flatLineItemProduct = (
  { variant: { product, ...variant } }
) => ({
  product_title: product.title,
  variant_title: variant.title,
  weight: (variant.weight) ?? product.weight,
  length: (variant.length) ?? product.length,
  height: (variant.height) ?? product.height,
  width: (variant.width) ?? product.width,
  origin_country: (variant.origin_country) ?? product.origin_country,
  material: (variant.material) ?? product.material,
  sku: variant.sku,
  barcode: variant.barcode,
  ean: variant.ean,
  upc: variant.upc,
  hs_code: (variant.hs_code) ?? product.hs_code,
  mid_code: (variant.mid_code) ?? product.mid_code
})

export const shippoLineItem = (item, price) => ({
  quantity: item.quantity,
  sku: item.variant.sku,
  title: item.variant.product.title,
  ...price,
  weight: item.variant.weight.toString(),
  weight_unit: options.weight_unit_type
})

export const shippoLineItems = async (cart, totalsService) => {
  return await Promise.all(
    cart.items.map(async item => {
      const totals = await totalsService.getLineItemTotals(
        item,
        cart,
        {
          include_tax: true,
          use_tax_lines: true,
        }
      )

      const product = flatLineItemProduct(item)

      return {
        quantity: item.quantity,
        sku: product.sku,
        title: product.title,
        total_price: humanizeAmount(
          totals.subtotal,
          cart.region.currency_code
        ).toString(),
        currency: cart.region.currency_code.toUpperCase(),
        weight: product.weight.toString(),
        weight_unit: options.weight_unit_type
      }
    })
  )
}

/** Convert medusa address to shippo
 * @param {object} address - medusa address object
 * @param {string} email - mail address
 * @return {object} - shippo address object
 */
export const shippoAddress = (address, email) => ({
  name: `${address.first_name} ${address.last_name}`,
  company: address.company,
  street1: address.address_1,
  street2: address?.address_2,
  street3: address?.address_3,
  city: address.city,
  state: address.province,
  zip: address.postal_code,
  country: address.country_code.toUpperCase(),
  phone: address.phone,
  email: email,
  validate: (address.country_code == 'us') ?? true
})

/** 
 * @param {string} id - a medusa ID
 * @return {string} - the type of ID, eg. order, ful, pay, etc
 */
export const getIDType = id => id.substr(0, id.indexOf('_'))

/** Calculates dimensional weight of LineItem
 * @param {object} item - cart LineItem
 * @return {int} - calculated dimensional weight
 */
export const itemDimensionalWeight = (
  { variant: { height, width, length } } = item) => height * width * length

/** Dimensional weight of each item in cart
 * @param {array} items - cart items array
 * @return {array} - calculated dimensional weight from each item
 */
export const cartDimensionalWeights = items => items.map(
  item => itemDimensionalWeight(item) * item.quantity
)
