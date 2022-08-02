export const config = (fn) =>
  fn({
    cart_id: "cart_01234567890",
    order_id: "order_01234567890",
    display_id: "11",
    claim_id: null,
    swap_id: null,
    fulfillments: [
      {
        id: "ful_01234567890",
        shippo_order_id: "shippo_order_01234567890",
        items: [
          {
            item_id: "item_01234567890",
          },
        ],
      },
    ],
    items: [
      {
        id: "item_01234567890",
        variant: "variant_01234567890",
        product: "prod_01234567890",
      },
      {
        id: "item_09876543210",
        variant: "variant_09876543210",
        product: "prod_09876543210",
      },
    ],
    shippo_order: {
      object_id: "shippo_order_01234567890",
      order_number: "11",
      transactions: [
        {
          object_id: "transaction_01234567890",
          tracking_number: "track_01234567890",
        },
        {
          object_id: "transaction_09876543210",
          tracking_number: "track_09876543210",
        },
      ],
    },
    shipping_options: [
      {
        id: "so_01234567890",
        name: "Express Shipping",
        data: {
          name: "Express Shipping USA",
          type: "LIVE_RATE",
        },
      },
      {
        id: "so_09876543210",
        name: "USPS Priority",
        data: {
          name: "USPS Priority",
        },
      },
    ],
  })