const AddressStatus = artifacts.require("AddressStatus");

contract('AddressStatus', (accounts) => {
  it("should set a status to an address", async () => {
    const instance = await AddressStatus.deployed();
    const account = accounts[1];

    await instance.setAddressStatus(account, 1);

    assert.equal(await instance.getAddressStatus(account), 1);
  });

  it("should avoid changing same address under 30 seconds", async () => {
    const instance = await AddressStatus.deployed();
    const account = accounts[2];
    let rejected = false;
    let errorMsg = "";

    await instance.setAddressStatus(account, 1);

    await instance.setAddressStatus(account, 2)
      .catch(error => {
        rejected = true;
        errorMsg = error;
      });

    assert.equal(rejected, true);
    assert.match(errorMsg, /Contract can only be changes at least each 30 seconds/);
    assert.equal(await instance.getAddressStatus(account), 1);
  });

  it("should avoid changing the address to same status", async () => {
    const instance = await AddressStatus.deployed();
    const account = accounts[3];
    let rejected = false;
    let errorMsg = "";

    await instance.setAddressStatus(account, 0)
      .catch(error => {
        rejected = true;
        errorMsg = error;
      });

    assert.equal(rejected, true);
    assert.match(errorMsg, /Avoid changing a contract to same status/);
  });

  it("should avoid changing an address at cancelled status", async () => {
    const instance = await AddressStatus.deployed();
    const account = accounts[4];
    let rejected = false;
    let errorMsg = "";

    await instance.setAddressStatus(account, 3);

    await new Promise(res => setTimeout(res, 30000));

    await instance.setAddressStatus(account, 1)
      .catch(error => {
        rejected = true;
        errorMsg = error;
      });

    assert.equal(rejected, true);
    assert.match(errorMsg, /Can't change a rejected contract/);
    assert.equal(await instance.getAddressStatus(account), 3);
  });

  it("should avoid changing a cleared address to analysis status", async () => {
    const instance = await AddressStatus.deployed();
    const account = accounts[5];
    let rejected = false;
    let errorMsg = "";

    await instance.setAddressStatus(account, 1);

    await new Promise(res => setTimeout(res, 30000));

    await instance.setAddressStatus(account, 0)
      .catch(error => {
        rejected = true;
        errorMsg = error;
      });

    assert.equal(rejected, true);
    assert.match(errorMsg, /Can't change a cleared contract to analysis/);
    assert.equal(await instance.getAddressStatus(account), 1);
  });

  it("should only allow to change a cancelled address to analysis", async () => {
    const instance = await AddressStatus.deployed();
    const account = accounts[6];
    let rejected = false;
    let errorMsg = "";

    await instance.setAddressStatus(account, 2);

    await new Promise(res => setTimeout(res, 30000));

    await instance.setAddressStatus(account, 1)
      .catch(error => {
        rejected = true;
        errorMsg = error;
      });

    assert.equal(rejected, true);
    assert.match(errorMsg, /Can only change a cancelled contract to analysis/);
    assert.equal(await instance.getAddressStatus(account), 2);

    await instance.setAddressStatus(account, 0);

    assert.equal(await instance.getAddressStatus(account), 0);
  });
});