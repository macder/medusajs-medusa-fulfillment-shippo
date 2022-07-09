import { faker } from "@faker-js/faker"
import {
  makeArrayOf,
  mockCarrierAccountsResponse,
  mockParcelTemplateResponse,
  mockServiceGroup,
  mockLiveRate,
} from "../__mocks__/data"

const shippo = jest.fn(() => ({
  carrieraccount: {
    list: jest.fn(async () =>
      mockCarrierAccountsResponse(faker.datatype.number({ min: 8, max: 10 }))
    ),
  },
  servicegroups: {
    list: jest.fn(async () =>
      makeArrayOf(mockServiceGroup, faker.datatype.number({ min: 2, max: 10 }))
    ),
  },
  userparceltemplates: {
    list: jest.fn(async () =>
      mockParcelTemplateResponse(faker.datatype.number({ min: 8, max: 20 }))
    ),
  },
  liverates: {
    create: jest.fn(async () => ({ results: makeArrayOf(mockLiveRate, 10) })),
  },
  order: {
    create: jest.fn(async () => ({ object_id: "1010101010" })),
    packingslip: jest.fn(async () => ({
      expires: "",
      slip_url: "https://console.log",
      created: ""
    }))
  },
}))

export default shippo
