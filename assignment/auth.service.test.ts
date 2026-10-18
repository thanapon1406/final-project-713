import { faker } from "@faker-js/faker";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as constituencyRepo from "../src/repositories/constituency.repository";
import * as userRepo from "../src/repositories/user.repository";
import { AuthService } from "../src/services/auth.service";
import { CONSTITUENCY, USER, aLaserCode, aNationalId } from "./support/builders";

// The service imports its repositories directly, so the mode of test-doubling is module mocking.
vi.mock("../src/repositories/user.repository", () => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByNationalId: vi.fn(),
  update: vi.fn(),
  updateRole: vi.fn(),
}));
vi.mock("../src/repositories/constituency.repository", () => ({
  findByLocation: vi.fn(),
  findById: vi.fn(),
}));
vi.mock("../src/services/upload.service", () => ({
  uploadToSupabase: vi.fn(),
  deleteFromSupabase: vi.fn(),
}));
// The generated Prisma client is heavy and the service only reads Role from it.
vi.mock("../src/generated/prisma", () => ({
  $Enums: { Role: { VOTER: "VOTER", EC: "EC", ADMIN: "ADMIN" } },
}));

const findByNationalId = vi.mocked(userRepo.findByNationalId);
const createUser = vi.mocked(userRepo.create);
const findByLocation = vi.mocked(constituencyRepo.findByLocation);

const authService = new AuthService();

const register = (nationalId: string, laserCode: string) =>
  authService.registerUser(
    nationalId,
    laserCode,
    "นาย",
    "ฐนพล",
    "สารสมุทร",
    "123 ถนนพหลโยธิน",
    undefined,
    "Bangkok",
    1,
  );

beforeEach(() => {
  // Happy-path default: nobody owns this id yet and the constituency exists.
  findByNationalId.mockReset().mockResolvedValue(null);
  findByLocation.mockReset().mockResolvedValue(CONSTITUENCY().build() as never);
  // Echo what the service persisted, so a wrong role would still fail UT-01.
  createUser.mockReset().mockImplementation((data) =>
    Promise.resolve({ ...USER().build(), ...data, id: 1 } as never),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AuthService.registerUser", () => {
  // 2.3.1 Success
  it("UT-01 [2.3.1 Happy Path]: registers a new voter in an existing constituency", async () => {
    // Arrange ว่า constituencyRepo.findByLocation จะคืนค่า constituency ที่มี id = 1
    const constituency = CONSTITUENCY().withId(1).build();
    findByLocation.mockResolvedValue(constituency as never);

    // Act ว่า registerUser จะเรียก userRepo.create และ constituencyRepo.findByLocation
    const user = await register(aNationalId(), aLaserCode());

    // Assert ว่า userRepo.create ถูกเรียกด้วย constituency.id = 1 และ role = VOTER
    expect(user.role).toBe("VOTER");
    expect(findByNationalId).toHaveBeenCalledTimes(1);
    expect(createUser).toHaveBeenCalledTimes(1);
  });

  // 2.3.2 Failure
  it("UT-02 [2.3.2 Failure Path]: refuses to register a national id that already exists", async () => {
    // Arrange
    findByNationalId.mockResolvedValue(USER().build() as never);

    // Act ว่าถูกใช้งานแล้ว + Assert ว่า createUser ไม่ถูกเรียก
    await expect(register(aNationalId(), aLaserCode())).rejects.toThrow(/ถูกใช้งานแล้ว/);
    expect(createUser).not.toHaveBeenCalled();
  });

  // 2.3.3 Stub — canned constituency id fed to the service
  it("UT-03 [2.3.3 Stub]: binds the new user to the constituency the stubbed repository returns", async () => {
    // Arrange ว่า constituencyRepo.findByLocation จะคืนค่า constituency ที่มี id = 42
    findByLocation.mockResolvedValue(CONSTITUENCY().withId(42).build() as never);

    // Act ว่า registerUser จะเรียก userRepo.create และ constituencyRepo.findByLocation
    await register(aNationalId(), aLaserCode());

    // Assert ว่า userRepo.create ถูกเรียกด้วย constituency.id = 42
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({ constituency: { connect: { id: 42 } } }),
    );
  });
});

describe("AuthService.loginUser", () => {
  // 2.3.5 Mock — asserts on the interaction, not just the result
  it("UT-05 [2.3.5 Mock]: expects the repository to be asked once for the national id", async () => {
    // Arrange ว่า userRepo.findByNationalId จะคืนค่า user ที่มี nationalId = "1234567890123"
    const user = USER().build();
    const nationalId = user.nationalId;
    findByNationalId.mockResolvedValue(user as never);

    // Act ว่า loginUser จะเรียก userRepo.findByNationalId และคืนค่า user
    const result = await authService.loginUser(nationalId, user.laserCode!);

    // Assert ว่า userRepo.findByNationalId ถูกเรียกเพียงครั้งเดียวด้วย nationalId และผลลัพธ์ตรงกับ user
    expect(findByNationalId).toHaveBeenCalledTimes(1);
    expect(findByNationalId).toHaveBeenCalledWith(nationalId);
    expect(result).toEqual(user);
  });

  // 2.3.6 Faker — random input, repeatable because faker is seeded
  it("UT-06 [2.3.6 Faker]: logs in with a randomly generated, domain-valid national id", async () => {
    // Arrange ว่า userRepo.findByNationalId จะคืนค่า user ที่มี nationalId = "1234567890123" และ laserCode = "ABC1234567"
    const nationalId = aNationalId();
    const laserCode = faker.string.alphanumeric({ length: 10, casing: "upper" });
    expect(nationalId).toHaveLength(13);
    findByNationalId.mockResolvedValue(
      USER().withNationalId(nationalId).withLaserCode(laserCode).build() as never,
    );

    // Act ว่า loginUser จะเรียก userRepo.findByNationalId และคืนค่า user
    const user = await authService.loginUser(nationalId, laserCode);

    // Assert ว่า userRepo.findByNationalId ถูกเรียกเพียงครั้งเดียวด้วย nationalId และผลลัพธ์ตรงกับ user
    expect(user.nationalId).toBe(nationalId);
    expect(findByNationalId).toHaveBeenCalledWith(nationalId);
  });
});
