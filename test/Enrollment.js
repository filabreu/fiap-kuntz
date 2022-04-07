const Enrollment = artifacts.require("Enrollment");

contract('Enrollment', (accounts) => {
  it("should enroll a student", async () => {
    const instance = await Enrollment.deployed();
    const account = accounts[0];
    const name = "John Doe";
    const age = 32;

    await instance.enroll(name, age, { from: account });

    assert.equal(await instance.isEnrolled(account), true);
  });

  it("should unenroll a student", async () => {
    const instance = await Enrollment.deployed();
    const account = accounts[0];

    assert.equal(await instance.isEnrolled(account), true);

    await instance.unenroll({ from: account });

    assert.equal(await instance.isEnrolled(account), false);
  });

  it("should validate student is enrolled before unenroll", async () => {
    const instance = await Enrollment.deployed();
    const account = accounts[1];

    let rejected = false;
    let errorMsg = "";

    await instance.unenroll({ from: account }).catch((error) => {
      errorMsg = error;
      rejected = true;
    });

    assert.equal(await rejected, true);
    assert.match(await errorMsg, /Student not enrolled/);
  });

  it("should validate a student age is at least 18", async () => {
    const instance = await Enrollment.deployed();
    const account = accounts[1];
    const name = "John Doe";
    const age = 16;

    let rejected = false;
    let errorMsg = "";

    await instance.enroll(name, age, { from: account }).catch((error) => {
      errorMsg = error;
      rejected = true;
    });

    assert.equal(await rejected, true);
    assert.match(await errorMsg, /Student age must be at least 18 years old/);
    assert.equal(await instance.isEnrolled(account), false);
  });

  it("should validate a student name is present", async () => {
    const instance = await Enrollment.deployed();
    const account = accounts[1];
    const name = "";
    const age = 32;

    let rejected = false;
    let errorMsg = "";

    await instance.enroll(name, age, { from: account }).catch((error) => {
      errorMsg = error;
      rejected = true;
    });

    assert.equal(await rejected, true);
    assert.match(await errorMsg, /Student name must be present/);
    assert.equal(await instance.isEnrolled(account), false);
  });

  it("should validate a student can only be enrolled once", async () => {
    const instance = await Enrollment.deployed();
    const account = accounts[1];
    const name = "John Doe";
    const age = 32;

    let rejected = false;
    let errorMsg = "";

    await instance.enroll(name, age, { from: account });

    assert.equal(await instance.isEnrolled(account), true);

    await instance.enroll(name, age, { from: account }).catch((error) => {
      errorMsg = error;
      rejected = true;
    });

    assert.equal(await rejected, true);
    assert.match(await errorMsg, /Student can only be enrolled once/);
  });

  it("should allow enrolling a student previously enrolled and unerolled", async () => {
    const instance = await Enrollment.deployed();
    const account = accounts[2];
    const name = "John Doe";
    const age = 32;

    await instance.enroll(name, age, { from: account });

    assert.equal(await instance.isEnrolled(account), true);

    await instance.unenroll({ from: account });

    assert.equal(await instance.isEnrolled(account), false);

    await instance.enroll(name, age, { from: account });

    assert.equal(await instance.isEnrolled(account), true);
  });

  it("should count number of enrollments", async () => {
    const instance = await Enrollment.deployed();
    const name = "John Doe";
    const age = 32;

    assert.equal(await instance.enrollmentsNumber(), 2);

    await instance.enroll(name, age, { from: accounts[3] });
    await instance.enroll(name, age, { from: accounts[4] });
    await instance.enroll(name, age, { from: accounts[5] });

    assert.equal(await instance.enrollmentsNumber(), 5);

    await instance.unenroll({ from: accounts[4] });

    assert.equal(await instance.enrollmentsNumber(), 4);
  });
});
