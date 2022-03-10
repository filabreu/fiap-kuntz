const Enrollment = artifacts.require("Enrollment");

contract('Enrollment', (accounts) => {
  it("should enroll a student", async () => {
    const instance = await Enrollment.deployed();
    const account = accounts[0];
    const name = "John Doe";
    const age = 32;

    await instance.enroll(name, age, { from: account });

    assert.equal(await instance.enrollmentsNumber(), 1);
    assert.equal(await instance.isEnrolled(account), true);
  });

  it("should only enroll a student once", async () => {
    const instance = await Enrollment.deployed();
    const account = accounts[0];
    const name = "John Doe";
    const age = 32;
    let rejected = false;
    let errorMsg = "";

    await instance.enroll(name, age, { from: account })
      .catch(error => {
        rejected = true;
        errorMsg = error;
      });

    assert.equal(rejected, true);
    assert.match(errorMsg, /Student can only be enrolled once/);
    assert.equal(await instance.enrollmentsNumber(), 1);
  });

  it("should unenroll a student", async () => {
    const instance = await Enrollment.deployed();
    const account = accounts[1];
    const name = "Jane Smith";
    const age = 28;

    await instance.enroll(name, age, { from: account });

    assert.equal(await instance.enrollmentsNumber(), 2);
    assert.equal(await instance.isEnrolled(account), true);

    await instance.unenroll({ from: account });

    assert.equal(await instance.enrollmentsNumber(), 1);
    assert.equal(await instance.isEnrolled(account), false);
  });

  it("should require student is enrolled before unenrolling", async () => {
    const instance = await Enrollment.deployed();
    const account = accounts[1];
    const name = "Jane Smith";
    const age = 28;
    let rejected = false;
    let errorMsg = "";

    assert.equal(await instance.enrollmentsNumber(), 1);
    assert.equal(await instance.isEnrolled(account), false);

    await instance.unenroll({ from: account })
      .catch(error => {
        rejected = true;
        errorMsg = error;
      });

    assert.equal(rejected, true);
    assert.match(errorMsg, /Student not enrolled/);
    assert.equal(await instance.enrollmentsNumber(), 1);
  });
});
