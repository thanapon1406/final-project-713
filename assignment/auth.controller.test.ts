import jwt from "jsonwebtoken";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthController } from "../src/controllers/auth.controller";
import { USER } from "./support/builders";

// Replace AuthService so importing the controller doesn't pull in Prisma or storage.
vi.mock("../src/services/auth.service", () => ({
  AuthService: class {
    registerUser = vi.fn();
    loginUser = vi.fn();
    getUserProfile = vi.fn();
    updateProfile = vi.fn();
    uploadProfileImage = vi.fn();
  },
}));

// Minimal Express Response that records what the controller sends.
const aResponse = () => {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res as never;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AuthController.login (spy)", () => {
  // 2.3.4 Spy — wraps the real jwt.sign to read the claims it was given
  it("UT-04 [2.3.4 Spy]: signs a JWT carrying the logged-in user identity", async () => {
    // Arrange ว่า AuthService.loginUser จะคืนค่า user ที่มี id = 7, nationalId = "1234567890123", role = "VOTER"
    const user = USER().withId(7).build();
    const fakeAuthService = { loginUser: vi.fn().mockResolvedValue(user) };
    const signSpy = vi.spyOn(jwt, "sign");
    const res = aResponse() as { status: ReturnType<typeof vi.fn> };
    const controller = new AuthController(fakeAuthService as never);

    // Act ว่า controller.login จะเรียก AuthService.loginUser และ jwt.sign
    await controller.login(
      { body: { nationalId: user.nationalId, laserCode: user.laserCode } } as never,
      res as never,
    );

    // Assert ว่า jwt.sign ถูกเรียกเพียงครั้งเดียวด้วย payload ที่มี id, nationalId, role ของ user และ res.status ถูกเรียกด้วย 200
    expect(signSpy).toHaveBeenCalledTimes(1);
    expect(signSpy.mock.calls[0][0]).toMatchObject({
      id: 7,
      nationalId: user.nationalId,
      role: user.role,
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
