import { faker } from "@faker-js/faker";

// Test data builders: valid data by default, each test overrides only what it cares about.
export const aNationalId = (): string =>
  faker.string.numeric({ length: 13, allowLeadingZeros: false });

export const aLaserCode = (): string =>
  faker.string.alphanumeric({ length: 10, casing: "upper" });

export interface Constituency {
  id: number;
  province: string;
  districtNumber: number;
  isClosed: boolean;
}

export class ConstituencyBuilder {
  private spec: Constituency;

  constructor() {
    this.spec = {
      id: faker.number.int({ min: 1, max: 999 }),
      province: faker.location.state(),
      districtNumber: faker.number.int({ min: 1, max: 30 }),
      isClosed: false,
    };
  }

  withId(id: number): this {
    this.spec.id = id;
    return this;
  }

  build(): Constituency {
    return { ...this.spec };
  }
}

export const CONSTITUENCY = (): ConstituencyBuilder => new ConstituencyBuilder();

export type Role = "VOTER" | "EC" | "ADMIN";

export interface User {
  id: number;
  nationalId: string;
  laserCode: string | null;
  title: string | null;
  firstName: string;
  lastName: string;
  address: string | null;
  imageUrl: string | null;
  role: Role;
  constituencyId: number;
  constituency?: Constituency;
}

export class UserBuilder {
  private spec: User;

  constructor() {
    this.spec = {
      id: faker.number.int({ min: 1, max: 999 }),
      nationalId: aNationalId(),
      laserCode: aLaserCode(),
      title: faker.helpers.arrayElement(["นาย", "นาง", "นางสาว"]),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      address: faker.location.streetAddress(),
      imageUrl: null,
      role: "VOTER",
      constituencyId: faker.number.int({ min: 1, max: 999 }),
    };
  }

  withId(id: number): this {
    this.spec.id = id;
    return this;
  }

  withNationalId(nationalId: string): this {
    this.spec.nationalId = nationalId;
    return this;
  }

  withLaserCode(laserCode: string): this {
    this.spec.laserCode = laserCode;
    return this;
  }

  asRole(role: Role): this {
    this.spec.role = role;
    return this;
  }

  inConstituency(constituency: Constituency): this {
    this.spec.constituencyId = constituency.id;
    this.spec.constituency = constituency;
    return this;
  }

  build(): User {
    return { ...this.spec };
  }
}

export const USER = (): UserBuilder => new UserBuilder();
