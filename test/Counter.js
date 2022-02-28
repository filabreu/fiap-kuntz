const Counter = artifacts.require("Counter");

contract('Counter', (accounts) => {
  it("count starts at 50", async () => {
    const instance = await Counter.deployed();

    assert.equal(await instance.getCount(), 50);
  });

  it("should increment counter", async () => {
    const instance = await Counter.deployed();
    const account = accounts[0];

    await instance.increment({ from: account });

    assert.equal(await instance.getCount(), 51);
  });

  it("should get the increments of an account", async () => {
    const instance = await Counter.deployed();
    const account = accounts[1];

    assert.equal(await instance.getCallerIncrements(account), 0);

    await instance.increment({ from: account });

    assert.equal(await instance.getCallerIncrements(account), 1);
  });
});