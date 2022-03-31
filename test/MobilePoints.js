const MobilePoints = artifacts.require("MobilePoints");

contract('MobilePoints', async (accounts) => {
  it("should register Products", async () => {
    const instance = await MobilePoints.deployed();
    const account = accounts[0];

    await instance.addProduct("Watch", 10, { from: account });
    await instance.addProduct("Cellphone", 50, { from: account });
    await instance.addProduct("Computer", 100, { from: account });

    const product1 = await instance.products(0);
    const product2 = await instance.products(1);
    const product3 = await instance.products(2);

    assert.equal(product1.name, "Watch");
    assert.equal(product1.points, 10);
    assert.equal(product2.name, "Cellphone");
    assert.equal(product2.points, 50);
    assert.equal(product3.name, "Computer");
    assert.equal(product3.points, 100);
  });

  it("should register a User and reward with 2 points", async () => {
    const instance = await MobilePoints.deployed();
    const account = accounts[0];

    await instance.register({ from: account });

    const awardedPoints = await instance.getPoints(account);

    assert.equal(awardedPoints, 2);
  });

  it("should validate if User is already registered upon registration", async () => {
    const instance = await MobilePoints.deployed();
    const account = accounts[0];

    let rejected = false;
    let errorMsg = "";

    await instance.register({ from: account })
      .catch(error => {
        errorMsg = error;
        rejected = true;
      });

    assert.equal(rejected, true);
    assert.match(errorMsg, /User is already registered/);
  });

  it("should add points to User", async () => {
    const instance = await MobilePoints.deployed();
    const account = accounts[0];

    const beforePoints = await instance.getPoints(account);

    assert.equal(beforePoints, 2);

    await instance.addPoints(10, { from: account });

    const afterPoints = await instance.getPoints(account);

    assert.equal(afterPoints, 12);
  });

  it("should validate User is registered when adding points", async () => {
    const instance = await MobilePoints.deployed();
    const account = accounts[1];

    let rejected = false;
    let errorMsg = "";

    await instance.addPoints(10, { from: account })
      .catch(error => {
        errorMsg = error;
        rejected = true;
      });

    assert.equal(rejected, true);
    assert.match(errorMsg, /User is not registered/);
  });

  it("should redeem Product to User and consume User points", async () => {
    const instance = await MobilePoints.deployed();
    const account = accounts[0];

    const beforePoints = await instance.getPoints(account);

    assert.equal(beforePoints, 12);

    await instance.redeemProduct(0, { from: account });

    const afterPoints = await instance.getPoints(account);
    const hasProduct = await instance.hasProduct(account, 0);

    assert.equal(afterPoints, 2);
    assert.equal(hasProduct, true);
  });

  it("should validate User is registered when redeeming products", async () => {
    const instance = await MobilePoints.deployed();
    const account = accounts[1];

    let rejected = false;
    let errorMsg = ""

    await instance.redeemProduct(1, { from: account })
      .catch(error => {
        errorMsg = error;
        rejected = true;
      });

    assert.equal(rejected, true);
    assert.match(errorMsg, /User is not registered/);
  });

  it("should validate Product is registered when redeeming products", async () => {
    const instance = await MobilePoints.deployed();
    const account = accounts[0];

    let rejected = false;
    let errorMsg = ""

    await instance.redeemProduct(5, { from: account })
      .catch(error => {
        errorMsg = error;
        rejected = true;
      });

    assert.equal(rejected, true);
    assert.match(errorMsg, /Product is not registered/);
  });

  it("should validate User has enough points to redeem Product", async () => {
    const instance = await MobilePoints.deployed();
    const account = accounts[0];

    let rejected = false;
    let errorMsg = ""

    await instance.redeemProduct(2, { from: account })
      .catch(error => {
        errorMsg = error;
        rejected = true;
      });

    assert.equal(rejected, true);
    assert.match(errorMsg, /You don't have enough points to redeem this product/);
  });

  it("should list User redeemed products", async () => {
    const instance = await MobilePoints.deployed();
    const account = accounts[0];

    let rejected = false;
    let errorMsg = ""

    await instance.redeemProduct(2, { from: account })
      .catch(error => {
        errorMsg = error;
        rejected = true;
      });

    assert.equal(rejected, true);
    assert.match(errorMsg, /You don't have enough points to redeem this product/);
  });
});
