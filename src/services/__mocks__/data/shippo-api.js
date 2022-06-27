import { faker } from "@faker-js/faker"

export const mockParcelTemplate = () => ({
  object_id: faker.database.mongodbObjectId(),
  object_owner: faker.internet.email(),
  object_created: faker.date.past(),
  object_updated: faker.date.past(),
  name: faker.random.words(4),
  length: faker.datatype.number({ min: 20, max: 100 }),
  width: faker.datatype.number({ min: 20, max: 100 }),
  height: faker.datatype.number({ min: 20, max: 100 }),
  distance_unit: "cm",
  weight: faker.datatype.number({ min: 200, max: 3000 }),
  weight_unit: "g",
})