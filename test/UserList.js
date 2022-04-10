const UserList = artifacts.require("UserList");

contract('UserList', async (accounts) => {
  it("should add a User", async () => {
    const instance = await UserList.deployed();
    const account = accounts[1];

    const tx = await instance.addUser("John Doe", 38, { from: account });

    const { logs } = tx;

    assert.ok(Array.isArray(logs));
    assert.equal(logs.length, 1);

    const log = logs[0];

    assert.equal(log.event, 'UserCreated');
    assert.deepEqual(log.args.user, ["John Doe", "38", "0", true, true, "0"]);
    assert.approximately(log.args.timestamp.toNumber(), Date.now() / 1000, 1);
  });

  it("should validate User address is unique", async () => {
    const instance = await UserList.deployed();
    const account = accounts[1];

    let rejected = false;
    let errorMsg = ""

    await instance.addUser("John Doe", 38, { from: account })
      .catch(error => {
        errorMsg = error;
        rejected = true;
      });

    assert.equal(rejected, true);
    assert.match(errorMsg, /User already registered/);
  });

  it("should validate User name is present", async () => {
    const instance = await UserList.deployed();
    const account = accounts[2];

    let rejected = false;
    let errorMsg = ""

    await instance.addUser("", 38, { from: account })
      .catch(error => {
        errorMsg = error;
        rejected = true;
      });

    assert.equal(rejected, true);
    assert.match(errorMsg, /Name must be present/);
  });

  it("should validate User age is greater than 0", async () => {
    const instance = await UserList.deployed();
    const account = accounts[2];

    let rejected = false;
    let errorMsg = ""

    await instance.addUser("John Doe", 0, { from: account })
      .catch(error => {
        errorMsg = error;
        rejected = true;
      });

    assert.equal(rejected, true);
    assert.match(errorMsg, /Age must be greater than 0/);
  });

  it("should switch a User access", async () => {
    const instance = await UserList.deployed();
    const owner = accounts[0];
    const account = accounts[1];

    const tx = await instance.switchAccess(account, { from: owner });

    const { logs } = tx;

    assert.ok(Array.isArray(logs));
    assert.equal(logs.length, 1);

    const log = logs[0];

    assert.equal(log.event, 'UserAccessChanged');
    assert.equal(log.args.userAddress, account);
    assert.equal(log.args.from, 0);
    assert.equal(log.args.to, 1);
    assert.approximately(log.args.timestamp.toNumber(), Date.now() / 1000, 1);
  });

  it("should only allow owner to switch a User access", async () => {
    const instance = await UserList.deployed();
    const notOwner = accounts[2];
    const account = accounts[1];

    let rejected = false;
    let errorMsg = ""

    await instance.switchAccess(account, { from: notOwner })
      .catch(error => {
        errorMsg = error;
        rejected = true;
      });

    assert.equal(rejected, true);
    assert.match(errorMsg, /Only owner can call this function/);
  });

  it("should validate User is registered when switching access", async () => {
    const instance = await UserList.deployed();
    const owner = accounts[0];
    const account = accounts[2];

    let rejected = false;
    let errorMsg = ""

    await instance.switchAccess(account, { from: owner })
      .catch(error => {
        errorMsg = error;
        rejected = true;
      });

    assert.equal(rejected, true);
    assert.match(errorMsg, /User is not registered/);
  });

  it("should allow editor to update a User data", async () => {
    const instance = await UserList.deployed();
    const editor = accounts[1];
    const account = accounts[3];

    await instance.addUser("John Doe", 38, { from: account });

    const tx = await instance.updateUser(account, "Jack Smith", "21", { from: editor });

    const { logs } = tx;

    assert.ok(Array.isArray(logs));
    assert.equal(logs.length, 1);

    const log = logs[0];

    assert.equal(log.event, "UserChanged");
    assert.equal(log.args.userAddress, account);
    assert.equal(log.args.editorAddress, editor);
    assert.deepEqual(log.args.from, ["John Doe", "38", "0", true, true, "0"]);
    assert.deepEqual(log.args.to, ["Jack Smith", "21", "0", true, true, "0"]);
    assert.approximately(log.args.timestamp.toNumber(), Date.now() / 1000, 1);
  });

  it("should only allow editor to update a User", async () => {
    const instance = await UserList.deployed();
    const notEditor = accounts[3];
    const account = accounts[1];

    let rejected = false;
    let errorMsg = ""

    await instance.updateUser(account, "Jack Smith", "21", { from: notEditor })
      .catch(error => {
        errorMsg = error;
        rejected = true;
      });

    assert.equal(rejected, true);
    assert.match(errorMsg, /You are not allowed to edit/);
  });

  it("should check if Editor is registered to update User", async () => {
    const instance = await UserList.deployed();
    const notEditor = accounts[2];
    const account = accounts[1];

    let rejected = false;
    let errorMsg = ""

    await instance.updateUser(account, "Jack Smith", "21", { from: notEditor })
      .catch(error => {
        errorMsg = error;
        rejected = true;
      });

    assert.equal(rejected, true);
    assert.match(errorMsg, /You are not registered/);
  });

  it("should allow registered User to request deactivation", async () => {
    const instance = await UserList.deployed();
    const account = accounts[1];

    const tx = await instance.requestDeactivation({ from: account });

    const { logs } = tx;

    assert.ok(Array.isArray(logs));
    assert.equal(logs.length, 1);

    const log = logs[0];

    assert.equal(log.event, "DeactivationRequested");
    assert.equal(log.args.userAddress, account);
    assert.approximately(log.args.timestamp.toNumber(), Date.now() / 1000, 1);
  });

  it("should validate user is registered to request deactivation", async () => {
    const instance = await UserList.deployed();
    const account = accounts[2];

    let rejected = false;
    let errorMsg = ""

    await instance.requestDeactivation({ from: account }).catch((error) => {
      errorMsg = error;
      rejected = true;
    });

    assert.equal(rejected, true);
    assert.match(errorMsg, /You are not registered/);
  });

  it("should allow registered User to cancel deactivation", async () => {
    const instance = await UserList.deployed();
    const account = accounts[1];

    const tx = await instance.cancelDeactivation({ from: account });

    const { logs } = tx;

    assert.ok(Array.isArray(logs));
    assert.equal(logs.length, 1);

    const log = logs[0];

    assert.equal(log.event, "DeactivationCanceled");
    assert.equal(log.args.userAddress, account);
    assert.approximately(log.args.timestamp.toNumber(), Date.now() / 1000, 1);
  });

  it("should validate User is registered to cancel deactivation", async () => {
    const instance = await UserList.deployed();
    const account = accounts[2];

    let rejected = false;
    let errorMsg = "";

    await instance.cancelDeactivation({ from: account }).catch((error) => {
      errorMsg = error;
      rejected = true;
    });

    assert.equal(rejected, true);
    assert.match(errorMsg, /You are not registered/);
  });

  it("should validate User requested deactivation to cancel deactivation", async () => {
    const instance = await UserList.deployed();
    const account = accounts[3];

    let rejected = false;
    let errorMsg = "";

    await instance.cancelDeactivation({ from: account }).catch((error) => {
      errorMsg = error;
      rejected = true;
    });

    assert.equal(rejected, true);
    assert.match(errorMsg, /Deactivation request do not exist/);
  });

  it("should only allow Owner to deactivate Users", async () => {
    const instance = await UserList.deployed();
    const account = accounts[3];
    const ownerAccount = accounts[1];
    let rejected = false;
    let errorMsg = "";

    await instance.deactivateUser(account, { from: ownerAccount }).catch((error) => {
      errorMsg = error;
      rejected = true;
    });

    assert.equal(rejected, true);
    assert.match(errorMsg, /Only owner can call this function/);
  });

  it("should validate User is registered when deactivating", async () => {
    const instance = await UserList.deployed();
    const account = accounts[2];
    const ownerAccount = accounts[0];
    let rejected = false;
    let errorMsg = "";

    await instance.deactivateUser(account, { from: ownerAccount }).catch((error) => {
      errorMsg = error;
      rejected = true;
    });

    assert.equal(rejected, true);
    assert.match(errorMsg, /User is not registered/);
  });

  it("should validate User requested deactivation after 30 seconds to be deactivated by Owner", async () => {
    const instance = await UserList.deployed();
    const account = accounts[3];
    const ownerAccount = accounts[0];

    await instance.requestDeactivation({ from: account });

    const tx = await instance.deactivateUser(account, { from: ownerAccount }).catch((error) => {
      errorMsg = error;
      rejected = true;
    });

    assert.equal(rejected, true);
    assert.match(errorMsg, /Deactivation requested less than 30 seconds ago/);
  });


  it("should allow registered User with requested deactivation to be deactivated by Owner after 30 seconds", async () => {
    const instance = await UserList.deployed();
    const account = accounts[3];
    const ownerAccount = accounts[0];

    await new Promise((resolve) => setTimeout(resolve, 30000));

    const tx = await instance.deactivateUser(account, { from: ownerAccount });
    const { logs } = tx;

    assert.ok(Array.isArray(logs));
    assert.equal(logs.length, 1);

    const log = logs[0];

    assert.equal(log.event, "UserDeactivated");
    assert.equal(log.args.userAddress, account);
    assert.approximately(log.args.timestamp.toNumber(), Date.now() / 1000, 1);
  });
});
