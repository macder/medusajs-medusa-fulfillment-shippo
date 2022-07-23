import { faker } from "@faker-js/faker"
import { makeArrayOf } from "./data-utils"
import { mockParcelTemplate } from "./shippo-api"

// WIP
export const mockPackerItem = () => {
  const dim = {
    weight: faker.datatype.number({ min: 200, max: 3000 }),
    length: faker.datatype.number({ min: 20, max: 100 }),
    width: faker.datatype.number({ min: 20, max: 100 }),
    height: faker.datatype.number({ min: 20, max: 100 }),
  }
  const volume = dim.length * dim.width * dim.height

  return {
    title: faker.commerce.productName(),
    product_id: `prod_${faker.database.mongodbObjectId()}`,
    variant_id: `variant_${faker.database.mongodbObjectId()}`,
    length: dim.length,
    width: dim.width,
    height: dim.height,
    weight: dim.weight,
    volume,
    locus: {
      allowed_rotation: [0, 1, 2, 3, 4, 5],
      rotation_type: 0,
      position: [0, 0, 0],
    },
  }
}

// WIP
export const mockPackerOutput = () => ({
  volume: {},
  items: makeArrayOf(mockPackerItem, 1),
})

// WIP
export const mockShippoBinPack = () => {
  const parcelTemplate = makeArrayOf(mockParcelTemplate, 2)

  return {
    ...parcelTemplate,
    packer_output: mockPackerOutput(),
  }
}

export const mockUserParcels = () => {

  return [
    {
      object_id: "",
      object_owner: "",
      object_created: "",
      object_updated: "",
      name: "Small cube box",
      length: "18",
      width: "18",
      height: "15",
      distance_unit: "cm",
      weight: null,
      weight_unit: null
    },
    {
      object_id: "",
      object_owner: "",
      object_created: "",
      object_updated: "",
      name: "Large cube box",
      length: "30",
      width: "30",
      height: "20",
      distance_unit: "cm",
      weight: null,
      weight_unit: null
    },
    {
      object_id: "",
      object_owner: "",
      object_created: "",
      object_updated: "",
      name: "Small side box",
      length: "28",
      width: "5",
      height: "33",
      distance_unit: "cm",
      weight: null,
      weight_unit: null
    },
    {
      object_id: "",
      object_owner: "",
      object_created: "",
      object_updated: "",
      name: "Medium side box",
      length: "30",
      width: "8",
      height: "36",
      distance_unit: "cm",
      weight: null,
      weight_unit: null
    },
    {
      object_id: "",
      object_owner: "",
      object_created: "",
      object_updated: "",
      name: "Large side box",
      length: "50",
      width: "14",
      height: "50",
      distance_unit: "cm",
      weight: null,
      weight_unit: null
    },
    {
      object_id: "",
      object_owner: "",
      object_created: "",
      object_updated: "",
      name: "Canada Post flat-rate small - 5kg max - $18.49",
      length: "35",
      width: "26",
      height: "5",
      distance_unit: "cm",
      weight: null,
      weight_unit: null
    },
    {
      object_id: "",
      object_owner: "",
      object_created: "",
      object_updated: "",
      name: "Canada Post flat-rate medium - 5kg max - $23.49",
      length: "39",
      width: "26",
      height: "12",
      distance_unit: "cm",
      weight: null,
      weight_unit: null
    },
    {
      object_id: "",
      object_owner: "",
      object_created: "",
      object_updated: "",
      name: "Canada Post flat-rate large - 5kg max - $29.99",
      length: "40",
      width: "30",
      height: "12",
      distance_unit: "cm",
      weight: null,
      weight_unit: null
    },
    {
      object_id: "",
      object_owner: "",
      object_created: "",
      object_updated: "",
      name: "Big meter box",
      length: "100",
      width: "100",
      height: "100",
      distance_unit: "cm",
      weight: null,
      weight_unit: null
    },
    {
      object_id: "",
      object_owner: "",
      object_created: "",
      object_updated: "",
      name: "Coffee Mug TEST",
      length: "11",
      width: "11",
      height: "15",
      distance_unit: "cm",
      weight: null,
      weight_unit: null
    },
    {
      object_id: "",
      object_owner: "",
      object_created: "",
      object_updated: "",
      name: "2 Coffee mugs TEST",
      length: "11",
      width: "21",
      height: "14",
      distance_unit: "cm",
      weight: null,
      weight_unit: null
    },
    {
      object_id: "",
      object_owner: "",
      object_created: "",
      object_updated: "",
      name: "Shorts TEST",
      length: "32",
      width: "36",
      height: "6",
      distance_unit: "cm",
      weight: null,
      weight_unit: null
    },
    {
      object_id: "",
      object_owner: "",
      object_created: "",
      object_updated: "",
      name: "Package for 4 Coffee Mugs",
      length: "20",
      width: "20",
      height: "14",
      distance_unit: "cm",
      weight: null,
      weight_unit: null
    },
    {
      object_id: "",
      object_owner: "",
      object_created: "",
      object_updated: "",
      name: "Package for 6 Coffee Mugs",
      length: "30",
      width: "20",
      height: "14",
      distance_unit: "cm",
      weight: null,
      weight_unit: null
    },
    {
      object_id: "",
      object_owner: "",
      object_created: "",
      object_updated: "",
      name: "Package for 12 Coffee Mugs",
      length: "30",
      width: "20",
      height: "28",
      distance_unit: "cm",
      weight: null,
      weight_unit: null
    },
    {
      object_id: "",
      object_owner: "",
      object_created: "",
      object_updated: "",
      name: "Package for 24 Coffee Mugs",
      length: "40",
      width: "30",
      height: "30",
      distance_unit: "cm",
      weight: null,
      weight_unit: null
    }
  ]

}
