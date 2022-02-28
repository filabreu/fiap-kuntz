const ArrayChanger = artifacts.require("ArrayChanger");

contract('ArrayChanger', (accounts) => {
  it("should add a value to the array", async () => {
    const instance = await ArrayChanger.deployed();
    const value = 1;

    await instance.addValue(value);

    assert.equal(await instance.values(0), value);
  });

  it("should validate uniqueness of array values", async () => {
    const instance = await ArrayChanger.deployed();
    const value = 1;

    let rejected = false;
    let errorMsg = ""

    await instance.addValue(value)
      .catch(error => {
        errorMsg = error;
        rejected = true;
      });

    assert.equal(rejected, true);
    assert.match(errorMsg, /Value must be unique/);
  });

  it("should remove item from array and shift next values", async () => {
    const instance = await ArrayChanger.deployed();

    await instance.addValue(2);
    await instance.addValue(3);

    assert.equal(await instance.values(1), 2);
    assert.equal(await instance.values(2), 3);

    await instance.removeValue(2);

    assert.equal(await instance.values(1), 3);
    assert.equal(await instance.values(2), 0);
  });
});
