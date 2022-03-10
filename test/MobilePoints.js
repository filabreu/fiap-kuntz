const MobilePoints = artifacts.require("MobilePoints");

contract('MobilePoints', (accounts) => {
  xit("should register a User", async () => {
    const instance = await Enrollment.deployed();
    const account = accounts[0];
  });

  xit("should reward a newly registered User with 2 points", async () => {
    const instance = await Enrollment.deployed();
    const account = accounts[0];
  });
});
