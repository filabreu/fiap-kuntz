// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

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

  event UserCreated(address indexed from, User user, uint256 timestamp);
  event UserAccessChanged(address indexed userAddress, AccessType from, AccessType to, uint256 timestamp);
  event UserChanged(address indexed userAddress, address editorAddress, User from, User to, uint256 timestamp);
  event DeactivationRequested(address indexed userAddress, uint256 timestamp);
  event DeactivationCanceled(address indexed userAddress, uint256 timestamp);
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

    emit UserCreated(msg.sender, _user, block.timestamp);
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

    emit DeactivationCanceled(msg.sender, block.timestamp);
  }

  function deactivateUser(address _userAddress) public onlyOwner isRegistered(_userAddress) isActive(_userAddress) {
    require(block.timestamp - users[_userAddress].deactivationRequestedAt >= 30, "Deactivation requested less than 30 seconds ago");

    users[_userAddress].isActive = false;

    emit UserDeactivated(_userAddress, block.timestamp);
  }
}

contract CrowdFunding {
  struct Campaign {
    uint256 id;
    string name;
    uint256 startTimestamp;
    uint256 endTimestamp;
    uint256 targetValueInWei;
  }

  uint256 campaignIdCounter = 0;
  mapping(uint256 => Campaign) campaigns;
  mapping(uint256 => address) campaignOwners;
  mapping(uint256 => address[5]) campaignAuditors;
  mapping(uint256 => address) campaignTreasurer;
  mapping(uint256 => uint256) campaignTreasury;
  mapping(uint256 => mapping(address => uint256)) campaignDonations;
  mapping(uint256 => address[]) campaignDonors;
  mapping(uint256 => bool) campaignApprovals;

  event CampaignCreated(uint256 id, address creator, uint256 createdAtTimestamp);
  event CampaignUpdated(uint256 id, address creator, string field, uint256 updatedAtTimestamp);
  event DonationSent(uint256 campaignId, address donor, uint256 donatedValueInWei, uint256 donatedAtTimestamp);
  event DonationWithdrawn(uint256 campaignId, address donor, uint256 withdrawnValueInWei, uint256 withdrawnAtTimestamp);
  event DonationReturned(uint256 campaignId, address creator, address donor, uint256 returnedValueInWei, uint256 returnedAtTimestamp);

  modifier onlyCampaignOwner(uint256 _campaignId) {
    require(campaignOwners[_campaignId] == msg.sender, "Must be campaign owner");
    _;
  }

  modifier onlyCampaignOwnerOrAuditor(uint256 _campaignId) {
    bool _isOwnerOrAuditor = false;

    if (campaignOwners[_campaignId] == msg.sender) {
      _isOwnerOrAuditor = true;
    }

    if (!_isOwnerOrAuditor) {
      address[5] memory _auditors = campaignAuditors[_campaignId];

      for (uint256 _i = 0; _i < _auditors.length; _i++) {
        if (_auditors[_i] == msg.sender) {
          _isOwnerOrAuditor = true;
          break;
        }
      }
    }

    require(_isOwnerOrAuditor, "Must be campaign owner or auditor");
    _;
  }

  modifier onlyCampaignTreasurer(uint256 _campaignId) {
    if (campaignTreasurer[_campaignId] != address(0)) {
      require(campaignTreasurer[_campaignId] == msg.sender, "Must be campaign treasurer");
    } else {
      require(campaignOwners[_campaignId] == msg.sender, "Must be campaign owner");
    }

    _;
  }

  function createCampaign(string memory _name, uint256 _startTimestamp, uint256 _endTimestamp, uint256 _targetValueInWei, address[5] memory _auditors) public payable {
    require(msg.value == 500000000 gwei, "Must deposit 0.5 ether");

    campaignIdCounter ++;
    campaigns[campaignIdCounter] = Campaign(campaignIdCounter, _name, _startTimestamp, _endTimestamp, _targetValueInWei);
    campaignOwners[campaignIdCounter] = msg.sender;
    campaignTreasurer[campaignIdCounter] = msg.sender;
    campaignAuditors[campaignIdCounter] = _auditors;

    emit CampaignCreated(campaignIdCounter, msg.sender, block.timestamp);
  }

  function setCampaignStartTimestamp(uint256 _campaignId, uint256 _newTimestamp) public onlyCampaignOwner(_campaignId) {
    Campaign memory _campaign = campaigns[_campaignId];

    require(_campaign.startTimestamp > block.timestamp, "Campaign must not have alreaady started");

    _campaign.startTimestamp = _newTimestamp;

    campaigns[_campaignId] = _campaign;

    emit CampaignUpdated(campaignIdCounter, msg.sender, "startTimestamp", block.timestamp);
  }

  function setCampaignEndTimestamp(uint256 _campaignId, uint256 _newTimestamp) public onlyCampaignOwner(_campaignId) {
    Campaign memory _campaign = campaigns[_campaignId];

    _campaign.endTimestamp = _newTimestamp;

    campaigns[_campaignId] = _campaign;

    emit CampaignUpdated(campaignIdCounter, msg.sender, "endTimestamp", block.timestamp);
  }

  function setCampaignTargetValue(uint256 _campaignId, uint256 _newTargetValue) public onlyCampaignOwner(_campaignId) {
    Campaign memory _campaign = campaigns[_campaignId];

    uint256 _raisedValueInWei = campaignTreasury[_campaignId];

    require(_raisedValueInWei >= _newTargetValue, "New target value must be equal or greater than raised value");

    _campaign.targetValueInWei = _newTargetValue;

    campaigns[_campaignId] = _campaign;

    emit CampaignUpdated(campaignIdCounter, msg.sender, "targetValueInWei", block.timestamp);
  }

  function setCampaignTreasurer(uint256 _campaignId, address _treasurer) public onlyCampaignOwner(_campaignId) {
    campaignTreasurer[_campaignId] = _treasurer;
  }

  function getTargetAndRaisedValues(uint256 _campaignId) public view onlyCampaignOwnerOrAuditor(_campaignId) returns(uint256, uint256) {
    Campaign memory _campaign = campaigns[_campaignId];
    uint256 raisedValueInWei = campaignTreasury[_campaignId];

    return (_campaign.targetValueInWei, raisedValueInWei);
  }

  function donateToCampaign(uint256 _campaignId, uint256 _valueInWei) public payable {
    require(msg.value == 250000000 gwei, "Must be at least 0.25 ether");

    Campaign memory _campaign = campaigns[_campaignId];

    require(_campaign.startTimestamp > block.timestamp, "Campaign has not started yet");
    require(_campaign.endTimestamp < block.timestamp, "Campaign has ended");

    emit DonationSent(_campaignId, msg.sender, _valueInWei, block.timestamp);

    campaignDonors[_campaignId].push(msg.sender);
    campaignTreasury[_campaignId] += _valueInWei;
    campaignDonations[_campaignId][msg.sender] += _valueInWei;
  }

  function withdrawDonation(uint256 _campaignId) public {
    uint256 _donatedValue = campaignDonations[_campaignId][msg.sender];

    require(_donatedValue > 0, "No donations made to this campaign");

    Campaign memory _campaign = campaigns[_campaignId];

    require(_campaign.endTimestamp > block.timestamp, "Campaign has already ended");

    campaignTreasury[_campaignId] -= _donatedValue;
    campaignDonations[_campaignId][msg.sender] = 0;

    uint256 _returnedValue = _donatedValue - 100000000 gwei;

    emit DonationWithdrawn(_campaignId, msg.sender, _returnedValue, block.timestamp);

    (bool sent, bytes memory _data) = payable(msg.sender).call{value: _returnedValue}("");
    require(sent, "Failed to send Ether");
  }

  function quitCampaign(uint256 _campaignId) public onlyCampaignOwner(_campaignId) {
    address[] memory _campaignDonors = campaignDonors[_campaignId];

    for (uint256 _i; _i > _campaignDonors.length; _i++) {
      address _donor = _campaignDonors[_i];
      uint256 _returnedValue = campaignDonations[_campaignId][_donor];

      campaignTreasury[_campaignId] -= _returnedValue;
      campaignDonations[_campaignId][_donor] = 0;

      emit DonationReturned(_campaignId, msg.sender, _donor, _returnedValue, block.timestamp);

      (bool sent, bytes memory _data) = payable(_donor).call{value: _returnedValue}("");
      require(sent, "Failed to send Ether");
    }
  }

  function approveCampaign(uint256 _campaignId) public onlyCampaignTreasurer(_campaignId) {
    campaignApprovals[_campaignId] = true;
  }

  function endCampaign(uint256 _campaignId) public onlyCampaignOwner(_campaignId) {
    Campaign memory _campaign = campaigns[_campaignId];
    uint256 _raisedValueInWei = campaignTreasury[_campaignId];

    if (_raisedValueInWei < _campaign.targetValueInWei) {
      require(_campaign.endTimestamp <= block.timestamp, "Campaign has not yet ended or reached target");
    }

    require(campaignApprovals[_campaignId], "Campaign must be approved");

    uint256 _raisedValue = campaignTreasury[_campaignId];

    _campaign.endTimestamp = block.timestamp;
    campaigns[_campaignId] = _campaign;

    address[] memory _campaignDonors = campaignDonors[_campaignId];

    for (uint256 _i; _i > _campaignDonors.length; _i++) {
      address _donor = _campaignDonors[_i];
      campaignDonations[_campaignId][_donor] = 0;
    }

    delete campaignDonors[_campaignId];
    campaignTreasury[_campaignId] = 0;

    uint256 _withdrawalValue = (_raisedValue * 98 / 100) + 500000000 gwei;

    (bool sent, bytes memory _data) = payable(msg.sender).call{value: _withdrawalValue}("");
    require(sent, "Failed to send Ether");
  }
}
