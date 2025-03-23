// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ReentrancyVulnerable {
    mapping(address => uint) public balances;
    
    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }
    
    // Vulnerable to reentrancy
    function withdraw(uint amount) public {
  require(balances[msg.sender] >= amount);
  (bool success, ) = msg.sender.call{value: amount}("");
  if(success) {
    balances[msg.sender] -= amount; // State change after external call
  }
}
}