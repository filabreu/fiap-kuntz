// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

contract LifeTracker {
  enum LifePhase { Child, Adult, Elder }

  struct Person {
    string name;
    LifePhase phase;
    uint8 age;
  }

  Person[] people;
  mapping(string => uint256) personNameToId;

  function createPerson(string memory _name, uint8 _age) public {
    for (uint256 i = 0; i < people.length; i++) {
      require(
        keccak256(abi.encodePacked(_name)) != keccak256(abi.encodePacked(people[i].name)),
        "Person name must be unique"
      );
    }

    uint256 _id = people.length;
    personNameToId[_name] = _id;
    people.push(_createPerson(_name, _age));
  }

  function findPerson(string memory _name) public view returns(Person memory) {
    uint256 _id = personNameToId[_name];

    return people[_id];
  }

  function _createPerson(string memory _name, uint8 _age) internal pure returns(Person memory) {
    LifePhase _phase;

    if (_age < 18) {
      _phase = LifePhase.Child;
    } else if (_age < 60) {
      _phase = LifePhase.Adult;
    } else {
      _phase = LifePhase.Elder;
    }

    return Person(_name, _phase, _age);
  }
}

contract Counter {
  uint256 count;

  mapping(address => uint256) callers;

  constructor() {
    count = 50;
  }

  function increment() public {
    count++;
    callers[msg.sender]++;
  }

  function getCount() public view returns(uint256) {
    return count;
  }

  function getCallerIncrements(address _caller) public view returns(uint256) {
    return callers[_caller];
  }
}

contract ArrayChanger {
  uint256[] public values;

  function addValue(uint256 _value) public {
    for (uint256 i = 0; i < values.length; i++) {
      require(_value != values[i], "Value must be unique");
    }

    values.push(_value);
  }

  function removeValue(uint256 _value) public {
    uint256 _matchIndex;

    for (uint256 i = 0; i < values.length; i++) {
      if (_value == values[i]) {
        delete values[i];
        _matchIndex = i;
      }

      if (i > _matchIndex) {
        values[i - 1] = values[i];
        delete values[i];
      }
    }
  }
}

contract AddressStatus {
  enum Status { Analysis, Cleared, Cancelled, Rejected }

  mapping(address => Status) addressStatuses;
  mapping(address => uint256) addressChangedAt;

  function setAddressStatus(address _userAddress, Status _status) public {
    Status _currentStatus = getAddressStatus(_userAddress);

    require(block.timestamp - addressChangedAt[_userAddress] >= 30, "Contract can only be changes at least each 30 seconds");
    require(_currentStatus != _status, "Avoid changing a contract to same status");
    require(_currentStatus != Status.Rejected, "Can't change a rejected contract");

    if (_currentStatus == Status.Cleared) {
      require(_status != Status.Analysis, "Can't change a cleared contract to analysis");
    }

    if (_currentStatus == Status.Cancelled) {
      require(_status == Status.Analysis, "Can only change a cancelled contract to analysis");
    }

    addressStatuses[_userAddress] = _status;
    addressChangedAt[_userAddress] = block.timestamp;
  }

  function getAddressStatus(address _userAddress) public view returns(Status) {
    return (addressStatuses[_userAddress]);
  }
}

contract Enrollment {
  struct Student {
    string name;
    uint8 age;
    bool isEnrolled;
  }

  mapping(address => Student) enrollments;
  uint256 enrollmentsCount;

  function enroll(string memory _name, uint8 _age) public {
    require(_age >= 18, "Student age must be at least 18 years old");
    require(bytes(_name).length > 0, "Student name must be present");
    require(!enrollments[msg.sender].isEnrolled, "Student can only be enrolled once");

    enrollments[msg.sender] = Student(_name, _age, true);
    enrollmentsCount += 1;
  }

  function unenroll() public {
    require(enrollments[msg.sender].isEnrolled, "Student not enrolled");

    delete enrollments[msg.sender];
    enrollmentsCount -= 1;
  }

  function isEnrolled(address _studentAddress) public view returns(bool) {
    return enrollments[_studentAddress].isEnrolled;
  }

  function enrollmentsNumber() public view returns(uint256) {
    return enrollmentsCount;
  }
}

contract MobilePoints {
  struct User {
    uint256 points;
    bool isRegistered;
  }

  struct Product {
    uint256 id;
    string name;
    uint256 points;
    bool isRegistered;
  }

  mapping(address => User) users;
  mapping(address => uint256[]) redeems;
  Product[] public products;

  address owner;

  modifier onlyOwner {
    require(msg.sender == owner, "Can only be called by contract owner");
    _;
  }

  modifier isRegistered(address _userAddress) {
    require(users[_userAddress].isRegistered, "User is not registered");
    _;
  }

  constructor() {
    owner = msg.sender;
  }

  function register() public {
    require(!users[msg.sender].isRegistered, "User is already registered");
    users[msg.sender] = User(2, true);
  }

  function addPoints(uint256 _points) public isRegistered(msg.sender) {
    users[msg.sender].points += _points;
  }

  function getPoints(address _userAddress) public view isRegistered(_userAddress) returns(uint256) {
    return users[_userAddress].points;
  }

  function redeemProduct(uint256 _productId) public isRegistered(msg.sender) {
    require(_productId < products.length, "Product is not registered");
    User memory _user = users[msg.sender];
    Product memory _product = products[_productId];

    require(_product.isRegistered == true, "Product is not registered");
    require(_user.points >= _product.points, "You don't have enough points to redeem this product");

    users[msg.sender].points -= _product.points;
    redeems[msg.sender].push(_productId);
  }

  function userProducts(address _userAddress) public view isRegistered(_userAddress) returns(Product[] memory) {
    uint256[] memory _userRedeems = redeems[_userAddress];
    Product[] memory _products = new Product[](_userRedeems.length);

    for (uint256 i; i < _userRedeems.length; i++) {
      _products[i] = products[_userRedeems[i]];
    }

    return _products;
  }

  function hasProduct(address _userAddress, uint256 _productId) public view isRegistered(_userAddress) returns(bool) {
    uint256[] memory _userRedeems = redeems[_userAddress];
    bool _hasProduct = false;

    for (uint256 i; i < _userRedeems.length; i++) {
      if (_userRedeems[i] == _productId) {
        _hasProduct = true;
        break;
      }
    }

    return _hasProduct;
  }

  // This is extra, but I added the functionality to add more products
  function addProduct(string memory _name, uint256 _points) public onlyOwner {
    products.push(Product(products.length, _name, _points, true));
  }

  // This is extra, but I added the functionality to remove products
  function removeProduct(uint256 _productId) public onlyOwner {
    products[_productId] = Product(0, "", 0, false);
  }
}
