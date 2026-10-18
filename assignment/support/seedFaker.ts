import { faker } from "@faker-js/faker";

// Seed once per file so generated data is identical on every run and failures reproduce.
export const FAKER_SEED = 20261003;

faker.seed(FAKER_SEED);
