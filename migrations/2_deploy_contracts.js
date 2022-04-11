const LifeTracker = artifacts.require("LifeTracker");
const Counter = artifacts.require("Counter");
const ArrayChanger = artifacts.require("ArrayChanger");
const AddressStatus = artifacts.require("AddressStatus");
const Enrollment = artifacts.require("Enrollment");
const MobilePoints = artifacts.require("MobilePoints");
const UserList = artifacts.require("UserList");
const CrowdFunding = artifacts.require("CrowdFunding");

module.exports = function(deployer) {
  deployer.deploy(LifeTracker);
  deployer.deploy(Counter);
  deployer.deploy(ArrayChanger);
  deployer.deploy(AddressStatus);
  deployer.deploy(Enrollment);
  deployer.deploy(MobilePoints);
  deployer.deploy(UserList);
  deployer.deploy(CrowdFunding);
};
