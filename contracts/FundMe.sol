// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./PriceConverter.sol";

error NotOwner();

/** @title FundMe contract to fund and withdraw funds
 * @author Muhammad Fahad
 * @notice this contract is demo to a funding contract
 * @dev This implement priceFeed as library
 */

contract FundMe {
  using PriceConverter for uint256;

  address public immutable i_owner;
  uint256 public constant MINIMUM_USD = 1;

  address[] public funders;
  mapping(address => uint256) public amountFunded;

  AggregatorV3Interface public priceFeed;

  modifier onlyOwner() {
    if(msg.sender != i_owner) revert NotOwner();
    _;
  }

  constructor(address priceFeedAddress) {
    i_owner = msg.sender;
    priceFeed = AggregatorV3Interface(priceFeedAddress);
  }

  function fund() public payable {
    require(
      msg.value.getConversionRate(priceFeed) >= MINIMUM_USD,
      "You did not Enough Send"
    );
    funders.push(msg.sender);
    amountFunded[msg.sender] = msg.value;
  }

  function withdraw() public onlyOwner {
    for (uint256 i; i < funders.length; i++) {
      amountFunded[funders[i]] = 0;
    }

    //rest array funders
    funders = new address[](0);

    // //transfer
    // payable(msg.sender).transfer(address(this).balance);
    // //send
    // bool success = payable(msg.sender).send(address(this).balance);
    // require(success, "Did not send");

    //call
    (bool success, ) = payable(msg.sender).call{value: address(this).balance}(
      ""
    );
    require(success, "Did not send");
  }

  function getPriceFeed() public view returns(AggregatorV3Interface) {
    return priceFeed;
  }
  function getAddressToAmountFunded(address _funder) public view returns(uint256) {
    return amountFunded[_funder];
  }
  function getFunder(uint256 _index) public view returns(address) {
    return funders[_index];
  }
  function getAmountFunded(address _funder) public view returns(uint256){
    return amountFunded[_funder];
  }
  function getOwner() public view returns(address) {
    return i_owner;
  }

  receive() external payable {
    fund();
  }

  fallback() external payable {
    fund();
  }
}
