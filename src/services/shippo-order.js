import { BaseService } from "medusa-interfaces"

class ShippoOrderService extends BaseService {
  #client
  #fulfillmentService
  #order
  #shippo
  #shippoTransactionService


  constructor({ fulfillmentService, shippoClientService, shippoTransactionService }, options) {
    super()

    /** @private @const {FulfillmentService} */
    this.#fulfillmentService = fulfillmentService

    /** @private @const {ShippoClientService} */
    this.#shippo = shippoClientService

    /** @private @const {ShippoTransactionService} */
    this.#shippoTransactionService = shippoTransactionService

    this.#client = this.#shippo.useClient
  }

  /**
   * 
   * @param {string} 
   * @return {Object}
   */
  async fetch() {

  }

  async fetchByFullfillment(fulfillmentId) {
    const shippoOrderId = await this.#getIdByFulfillment(fulfillmentId)

    return await this.#client.order.retrieve(shippoOrderId)
      .then(order => {

        if (order.transactions.length) {

          const transactions = order.transactions.map(async ta => {
            ta.is_return = await this.#shippoTransactionService.isReturn(ta.object_id)

            console.log("==================", ta.is_return)

            console.log("==================", ta.object_id)
            
            // return ta


          })
          // order.transactions = transactions
        }
        
        return order


      })
  }

  // async #add


  async #getIdByFulfillment(fulfillmentId) {
    const fullfillment = await this.#fulfillmentService.retrieve(fulfillmentId)

    if (!fullfillment.data?.shippo_order_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Shippo order not found for fulfillment with id: ${fulfillmentId}`
      )
    }

    const {
      data: { shippo_order_id },
    } = fullfillment

    return shippo_order_id
  }

}

export default ShippoOrderService
