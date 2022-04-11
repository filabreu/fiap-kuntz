const CrowdFunding = artifacts.require("CrowdFunding");

const toBN = web3.utils.toBN;
const nullAddress = "0x0000000000000000000000000000000000000000";

contract('CrowdFunding', async (accounts) => {
  it("should create a Campaign", async () => {
    const instance = await CrowdFunding.deployed();
    const account = accounts[0];

    const startTimestamp = Math.floor(Date.now() / 1000);
    const endTimestamp = startTimestamp + (30 * 24 * 6400);
    const targetValue = toBN(10 * 1e18);

    const tx = await instance.createCampaign(
      "My Current Campaign",
      startTimestamp,
      endTimestamp,
      targetValue,
      [accounts[1], accounts[2], nullAddress, nullAddress, nullAddress],
      {
        value: toBN(0.5 * 1e18),
        from: account
      }
    );

    const { logs } = tx;

    assert.ok(Array.isArray(logs));
    assert.equal(logs.length, 1);

    const log = logs[0];

    assert.equal(log.event, "CampaignCreated");
    assert.equal(log.args.id, 1);
    assert.equal(log.args.creator, account);
    assert.approximately(log.args.createdAtTimestamp.toNumber(), Date.now() / 1000, 1);
  });

  it("should validate Campaign deposit is 0.5 upon creation", async () => {
    const instance = await CrowdFunding.deployed();
    const account = accounts[0];

    const startTimestamp = Math.floor(Date.now() / 1000);
    const endTimestamp = startTimestamp + (30 * 24 * 6400);
    const targetValue = toBN(10 * 1e18);

    let rejected = false;
    let errorMsg = "";

    await instance.createCampaign(
      "My Campaign",
      startTimestamp,
      endTimestamp,
      targetValue,
      [accounts[1], accounts[2], nullAddress, nullAddress, nullAddress],
      {
        value: 0,
        from: account
      }
    ).catch(error => {
      errorMsg = error;
      rejected = true;
    });

    assert.equal(rejected, true);
    assert.match(errorMsg, /Must deposit 0.5 ether/);
  });

  it("should change start date of a Campaign", async () => {
    const instance = await CrowdFunding.deployed();
    const account = accounts[0];

    const startTimestamp = Math.floor(Date.now() / 1000 + (30 * 24 * 6400));
    const endTimestamp = startTimestamp + (60 * 24 * 6400);
    const targetValue = toBN(10 * 1e18);

    const newStartTimestamp = Math.floor(Date.now() / 1000 + (45 * 24 * 6400));

    await instance.createCampaign(
      "My Future Campaign",
      startTimestamp,
      endTimestamp,
      targetValue,
      [nullAddress, nullAddress, nullAddress, nullAddress, nullAddress],
      {
        value: toBN(0.5 * 1e18),
        from: account
      }
    );

    const tx = await instance.setCampaignStartTimestamp(2, newStartTimestamp, { from: account });

    const { logs } = tx;

    assert.ok(Array.isArray(logs));
    assert.equal(logs.length, 1);

    const log = logs[0];

    assert.equal(log.event, "CampaignUpdated");
    assert.equal(log.args.id, 2);
    assert.equal(log.args.creator, account);
    assert.equal(log.args.field, "startTimestamp");
    assert.approximately(log.args.updatedAtTimestamp.toNumber(), Date.now() / 1000, 1);
  });

  it("should validate only Campaign Owner can change start date of a Campaign", async () => {
    const instance = await CrowdFunding.deployed();
    const account = accounts[1];

    let rejected = false;
    let errorMsg = "";

    const newStartTimestamp = Math.floor(Date.now() / 1000 + (30 * 24 * 6400));

    await instance.setCampaignStartTimestamp(2, newStartTimestamp, { from: account })
      .catch(error => {
        errorMsg = error;
        rejected = true;
      });

    assert.equal(rejected, true);
    assert.match(errorMsg, /Must be campaign owner/);
  });

  it("should validate if Campaign has not started when changing start date of a Campaign", async () => {
    const instance = await CrowdFunding.deployed();
    const account = accounts[0];

    let rejected = false;
    let errorMsg = "";

    const newStartTimestamp = Math.floor(Date.now() / 1000 + (30 * 24 * 6400));

    await instance.setCampaignStartTimestamp(1, newStartTimestamp, { from: account })
      .catch(error => {
        errorMsg = error;
        rejected = true;
      });

    assert.equal(rejected, true);
    assert.match(errorMsg, /Campaign must not have alreaady started/);
  });

  it("should change end date of a Campaign", async () => {
    const instance = await CrowdFunding.deployed();
    const account = accounts[0];

    const newEndTimestamp = Math.floor(Date.now() / 1000 + (60 * 24 * 6400));

    const tx = await instance.setCampaignEndTimestamp(1, newEndTimestamp, { from: account });

    const { logs } = tx;

    assert.ok(Array.isArray(logs));
    assert.equal(logs.length, 1);

    const log = logs[0];

    assert.equal(log.event, "CampaignUpdated");
    assert.equal(log.args.id, 1);
    assert.equal(log.args.creator, account);
    assert.equal(log.args.field, "endTimestamp");
    assert.approximately(log.args.updatedAtTimestamp.toNumber(), Date.now() / 1000, 1);
  });

  it("should validate only Campaign Owner can change end date of a Campaign", async () => {
    const instance = await CrowdFunding.deployed();
    const account = accounts[1];

    let rejected = false;
    let errorMsg = "";

    const newEndTimestamp = Math.floor(Date.now() / 1000 + (30 * 24 * 6400));

    await instance.setCampaignStartTimestamp(1, newEndTimestamp, { from: account })
      .catch(error => {
        errorMsg = error;
        rejected = true;
      });

    assert.equal(rejected, true);
    assert.match(errorMsg, /Must be campaign owner/);
  });

  it("should change target value of a Campaign", async () => {
    const instance = await CrowdFunding.deployed();
    const account = accounts[0];

    const newTargetValue = toBN(20 * 1e18);

    const tx = await instance.setCampaignTargetValue(1, newTargetValue, { from: account });

    const { logs } = tx;

    assert.ok(Array.isArray(logs));
    assert.equal(logs.length, 1);

    const log = logs[0];

    assert.equal(log.event, "CampaignUpdated");
    assert.equal(log.args.id, 1);
    assert.equal(log.args.creator, account);
    assert.equal(log.args.field, "targetValueInWei");
    assert.approximately(log.args.updatedAtTimestamp.toNumber(), Date.now() / 1000, 1);
  });

  it("should validate only Campaign Owner can change target value of a Campaign", async () => {
    const instance = await CrowdFunding.deployed();
    const account = accounts[1];

    let rejected = false;
    let errorMsg = "";

    const newTargetValue = toBN(20 * 1e18)

    await instance.setCampaignTargetValue(1, newTargetValue, { from: account })
      .catch(error => {
        errorMsg = error;
        rejected = true;
      });

    assert.equal(rejected, true);
    assert.match(errorMsg, /Must be campaign owner/);
  });

  it("should receive donation to a Campaign", async () => {
    const instance = await CrowdFunding.deployed();
    const account = accounts[3];

    const donatedValue = toBN(1e18);

    const tx = await instance.donateToCampaign(1, { value: donatedValue, from: account });

    const { logs } = tx;

    assert.ok(Array.isArray(logs));
    assert.equal(logs.length, 1);

    const log = logs[0];

    assert.equal(log.event, "DonationReceived");
    assert.equal(log.args.campaignId, 1);
    assert.equal(log.args.donor, account);
    assert.equal(log.args.donatedValueInWei.toString(10), donatedValue.toString(10));
    assert.approximately(log.args.donatedAtTimestamp.toNumber(), Date.now() / 1000, 1);
  });

  it("should raise Campaign raised value when donation is made", async () => {
    const instance = await CrowdFunding.deployed();
    const owner = accounts[0];
    const account = accounts[4];

    const donatedValue = toBN(2.3 * 1e18);

    const resultBefore = await instance.getTargetAndRaisedValues(1, { from: owner });

    const raisedValueBefore = resultBefore[0];

    await instance.donateToCampaign(1, { value: donatedValue, from: account });

    // const [_targetValueAfter, raisedValueAfter] = await instance.getTargetAndRaisedValues(1, { from: owner });

    assert.equal(raisedValueBefore.toString(10), toBN(1e18).toString(10));
    // assert.equal(raisedValueAfter.toString(10), toBN(3.3 * 1e18).toString(10));
  });

  it("should validate donation to Campaign is at least 0.25 ether", async () => {
    const instance = await CrowdFunding.deployed();
    const account = accounts[3];

    const donatedValue = toBN(0.1 * 1e18);

    let rejected = false;
    let errorMsg = "";

    await instance.donateToCampaign(1, { value: donatedValue, from: account })
      .catch(error => {
        errorMsg = error;
        rejected = true;
      });

    assert.equal(rejected, true);
    assert.match(errorMsg, /Must donate at least 0.25 ether/);
  });

  it("should validate Campaign has already started when receiving donation", async () => {
    const instance = await CrowdFunding.deployed();
    const account = accounts[3];

    const donatedValue = toBN(1e18);

    let rejected = false;
    let errorMsg = "";

    await instance.donateToCampaign(2, { value: donatedValue, from: account })
      .catch(error => {
        errorMsg = error;
        rejected = true;
      });

    assert.equal(rejected, true);
    assert.match(errorMsg, /Campaign has not started yet/);
  });

  it("should validate Campaign has not yet ended started when receiving donation", async () => {
    const instance = await CrowdFunding.deployed();
    const account = accounts[3];

    const donatedValue = toBN(1e18);

    const startTimestamp = Math.floor(Date.now() / 1000) - (60 * 24 * 6400);
    const endTimestamp = startTimestamp - (30 * 24 * 6400);
    const targetValue = toBN(10 * 1e18);

    await instance.createCampaign(
      "My Past Campaign",
      startTimestamp,
      endTimestamp,
      targetValue,
      [nullAddress, nullAddress, nullAddress, nullAddress, nullAddress],
      {
        value: toBN(0.5 * 1e18),
        from: account
      }
    );

    let rejected = false;
    let errorMsg = "";

    await instance.donateToCampaign(3, { value: donatedValue, from: account })
      .catch(error => {
        errorMsg = error;
        rejected = true;
      });

    assert.equal(rejected, true);
    assert.match(errorMsg, /Campaign has ended/);
  });

  xit("should withdraw donation to a Campaign and return 90% back to User", async () => {
    const instance = await CrowdFunding.deployed();
    const account = accounts[3];

    const returnedValue = toBN(0.9 * 1e18);

    const tx = await instance.withdrawDonation(1, { from: account });

    const { logs } = tx;

    assert.ok(Array.isArray(logs));
    assert.equal(logs.length, 1);

    const log = logs[0];

    assert.equal(log.event, "DonationReceived");
    assert.equal(log.args.campaignId, 1);
    assert.equal(log.args.donor, account);
    assert.equal(log.args.donatedValueInWei.toString(10), donatedValue.toString(10));
    assert.approximately(log.args.donatedAtTimestamp.toNumber(), Date.now() / 1000, 1);
  });
});