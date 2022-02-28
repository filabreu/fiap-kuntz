const LifeTracker = artifacts.require("LifeTracker");

contract('LifeTracker', (accounts) => {
  it("should add Person to people list and find it later", async () => {
    const instance = await LifeTracker.deployed();
    const account = accounts[0];
    
    const name = "John Doe";
    const age = 32;

    await instance.createPerson(name, age, { from: account });
    const person = await instance.findPerson(name);

    assert.equal(person.name, name);
    assert.equal(person.age, age);
  });

  it("should validate uniqueness of Person name when adding to people list", async () => {
    const instance = await LifeTracker.deployed();
    const account = accounts[0];

    const name = "John Doe";
    const age = 32;

    let rejected = false;
    let errorMsg = ""

    await instance.createPerson(name, age, { from: account })
      .catch(error => {
        errorMsg = error;
        rejected = true;
      });

    assert.equal(rejected, true);
    assert.match(errorMsg, /Person name must be unique/);
  });

  it("should set Person life phase to Child based on age", async () => {
    const instance = await LifeTracker.deployed();
    const account = accounts[0];
    
    const name = "Jimmy";
    const age = 6;

    await instance.createPerson(name, age, { from: account });
    const person = await instance.findPerson(name);

    assert.equal(person.name, name);
    assert.equal(person.age, age);
    assert.equal(person.phase, 0);
  });

  it("should set Person life phase to Adult based on age", async () => {
    const instance = await LifeTracker.deployed();
    const account = accounts[0];
    
    const name = "James";
    const age = 32;

    await instance.createPerson(name, age, { from: account });
    const person = await instance.findPerson(name);

    assert.equal(person.name, name);
    assert.equal(person.age, age);
    assert.equal(person.phase, 1);
  });

  it("should set Person life phase to Elder based on age", async () => {
    const instance = await LifeTracker.deployed();
    const account = accounts[0];
    
    const name = "Ol McDonald";
    const age = 97;

    await instance.createPerson(name, age, { from: account });
    const person = await instance.findPerson(name);

    assert.equal(person.name, name);
    assert.equal(person.age, age);
    assert.equal(person.phase, 2);
  });
});
