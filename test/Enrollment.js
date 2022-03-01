const Enrollment = artifacts.require("Enrollment");

contract('Enrollment', (accounts) => {
  it("should enroll a student", async () => {
    const instance = await Enrollment.deployed();
    const account = accounts[0];
    const name = "John Doe";
    const age = 32;

    await instance.enroll(name, age, { from: account });

    assert.equal(await instance.getAddressStatus(account), 1);
  });
});
