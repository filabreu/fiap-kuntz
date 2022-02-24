// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;

contract UserList {
  enum AccessType { Reader, Editor }

  struct User {
    string name;
    uint8 age;
    AccessType accessType;
    bool isActive;
    bool isRegistered;
    uint256 deactivationRequestedAt;
  }

  event UserCreated(address indexed from, User user);
  event UserAccessChanged(address indexed userAddress, AccessType from, AccessType to, uint256 timestamp);
  event UserChanged(address indexed userAddress, address editorAddress, User from, User to, uint256 timestamp);
  event DeactivationRequested(address indexed userAddress, uint256 timestamp);
  event UserDeactivated(address indexed userAddress, uint256 timestamp);

  address owner;
  mapping(address => User) users;
  mapping(address => uint256) deactivationRequests;

  modifier onlyRegistered() {
    require(users[msg.sender].isRegistered, "You are not registered");
    _;
  }

  modifier onlyEditor() {
    require(users[msg.sender].accessType == AccessType.Editor, "You are not allowed to edit");
    _;
  }

  modifier onlyOwner() {
    require(msg.sender == owner, "Only owner can call this function");
    _;
  }

  modifier onlyActive() {
    require(users[msg.sender].isActive, "Your user is deactivated");
    _;
  }

  modifier validAddress(address _address) {
    require(_address != address(0), "Address cannot be 0 address");
    _;
  }

  modifier isRegistered(address _userAddress) {
    require(users[_userAddress].isRegistered, "User is not registered");
    _;
  }

  modifier isActive(address _userAddress) {
    require(users[_userAddress].isActive, "User is no longer active");
    _;
  }

  modifier userIsValid(string memory _name, uint256 _age) {
    require(bytes(_name).length > 0, "Name must be present");
    require(_age > 0, "Age must be greater than 0");

    _;
  }

  constructor() {
    owner = msg.sender;
  }

  function addUser(string memory _name, uint8 _age) public userIsValid(_name, _age) {
    require(!users[msg.sender].isRegistered, "User already registered");

    User memory _user = User(_name, _age, AccessType.Reader, true, true, 0);
    users[msg.sender] = _user;

    emit UserCreated(msg.sender, _user);
  }

  function switchAccess(address _userAddress) public onlyOwner isRegistered(_userAddress) isActive(_userAddress) {
    User memory _user = users[_userAddress];
    AccessType _currentAccess = _user.accessType;

    if (_currentAccess == AccessType.Reader) {
      _user.accessType = AccessType.Editor;
    } else {
      _user.accessType = AccessType.Reader;
    }

    assert(_user.accessType != _currentAccess);

    users[_userAddress] = _user;

    emit UserAccessChanged(_userAddress, _currentAccess, _user.accessType, block.timestamp);
  }

  function updateUser(address _userAddress, string memory _newName, uint8 _newAge) public onlyRegistered onlyEditor onlyActive isRegistered(_userAddress) isActive(_userAddress) userIsValid(_newName, _newAge) {
    User memory _currentUser = users[_userAddress];

    users[_userAddress].name = _newName;
    users[_userAddress].age = _newAge;

    emit UserChanged(_userAddress, msg.sender, _currentUser, users[_userAddress], block.timestamp);
  }

  function requestDeactivation() public onlyRegistered onlyActive {
    users[msg.sender].deactivationRequestedAt = block.timestamp;

    emit DeactivationRequested(msg.sender, block.timestamp);
  }

  function cancelDeactivation() public onlyRegistered onlyActive {
    require(users[msg.sender].deactivationRequestedAt > 0, "Deactivation request do not exist");
    require(block.timestamp - users[msg.sender].deactivationRequestedAt < 30, "Deactivation requested over 30 seconds ago");

    users[msg.sender].deactivationRequestedAt = 0;
  }

  function deactivateUser(address _userAddress) public onlyOwner isRegistered(_userAddress) isActive(_userAddress) validAddress(_userAddress) {
    require(block.timestamp - users[_userAddress].deactivationRequestedAt >= 30, "Deactivation requested less than 30 seconds ago");

    users[_userAddress].isActive = false;

    emit UserDeactivated(_userAddress, block.timestamp);
  }
}
