// The controller signs real JWTs, so the tests need a secret. No DB or storage creds — everything is mocked.
process.env.JWT_SECRET ??= "FYW.fvj5pkd3rxr3pfk";
