// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SampleToken
 * @dev A sample ERC20 token with some deliberate vulnerabilities for testing
 */
contract SampleToken {
    string public name = "Sample Token";
    string public symbol = "SMPL";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    address public owner;
    
    constructor(uint256 initialSupply) {
        totalSupply = initialSupply * 10 ** uint256(decimals);
        balanceOf[msg.sender] = totalSupply;
        owner = msg.sender;
    }
    
    // Vulnerability 1: No event emission
    function transfer(address to, uint256 value) public returns (bool success) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        return true;
    }
    
    // Vulnerability 2: No check for zero address
    function approve(address spender, uint256 value) public returns (bool success) {
        allowance[msg.sender][spender] = value;
        return true;
    }
    
    // Vulnerability 3: No SafeMath, potential for overflow/underflow in older Solidity versions
    function transferFrom(address from, address to, uint256 value) public returns (bool success) {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        return true;
    }
    
    // Vulnerability 4: Reentrancy vulnerability
    function withdraw(uint256 amount) public {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        
        // Vulnerability: state change after external call
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        balanceOf[msg.sender] -= amount;
    }
    
    // Vulnerability 5: Centralization risk
    function mint(address to, uint256 amount) public {
        require(msg.sender == owner, "Only owner can mint");
        
        totalSupply += amount;
        balanceOf[to] += amount;
    }
    
    // Vulnerability 6: Gas inefficiency
    function batchTransfer(address[] memory recipients, uint256[] memory values) public returns (bool) {
        require(recipients.length == values.length, "Arrays length mismatch");
        
        for (uint i = 0; i < recipients.length; i++) {
            require(transfer(recipients[i], values[i]));
        }
        
        return true;
    }
    
    // Missing some standard ERC20 functions for compliance checker testing
}