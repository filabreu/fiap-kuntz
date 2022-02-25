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
      require(keccak256(abi.encodePacked(_name)) != keccak256(abi.encodePacked(people[i].name)));
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
    count = count++;
    callers[msg.sender] = callers[msg.sender]++;
  }

  function getCount() public view returns(uint256) {
    return count;
  }

  function getCallerIncrements(address _caller) public view returns(uint256) {
    return callers[_caller];
  }
}

contract ArrayChanger {
  uint256[] values;

  function addValue(uint256 _value) public {
    for (uint256 i = 0; i < values.length; i++) {
      require(_value != values[i]);
    }

    values.push(_value);
  }

  function removeValue(uint256 _value) public {
    uint256 _matchIndex;

    for (uint256 i = 0; i < values.length; i++) {
      if (_value != values[i]) {
        delete values[i];
        _matchIndex = i;
      }

      if (i > _matchIndex) {
        values[i - 1] = values[i];    
      }
    }
    values.push(_value);
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
    require(_currentStatus != Status.Cancelled, "Can't change a cancelled contract");

    if (_currentStatus == Status.Cleared) {
      require(_status != Status.Analysis, "Can't change a cleared contract to analysis");
    }

    if (_currentStatus == Status.Cleared) {
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

  mapping(address => uint256) enrollmentIds;
  Student[] enrollments;

  function enroll(string memory _name, uint8 _age) public {
    require(_age >= 18, "Student age must be at least 18 years old");
    require(bytes(_name).length > 0, "Student name must be present");
    require(enrollments[enrollmentIds[msg.sender]].isEnrolled, "Student can only be enrolled once");

    enrollmentIds[msg.sender] = enrollments.length;
    enrollments.push(Student(_name, _age, true));
  }

  function unenroll() public {
    uint256 _id = enrollmentIds[msg.sender];

    require(enrollments[_id].isEnrolled, "Student not enrolled");

    delete enrollments[_id];
  }

  function isEnrolled(address _studentAddress) public view returns(bool) {
    uint256 _id = enrollmentIds[_studentAddress];
    return enrollments[_id].isEnrolled;
  }

  function enrollmentsNumber() public view returns(uint256) {
    return enrollments.length - 1;
  }
}
