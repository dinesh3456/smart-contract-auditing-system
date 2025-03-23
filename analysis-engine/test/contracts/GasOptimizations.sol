// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GasWaster {
    uint256 public stateVar;
    uint256[] public array;
    
    // Multiple state variable reads - GAS-01
    function multipleStateReads() public view returns (uint256) {
        uint256 result = 0;
        if (stateVar > 10) {
            result += stateVar;  // First read
        }
        if (stateVar > 20) {
            result += stateVar * 2;  // Second read
        }
        if (stateVar > 30) {
            result += stateVar * 3;  // Third read
        }
        return result;
    }
    
    // Inefficient loop - GAS-05
    function inefficientLoop() public {
        for (uint i = 0; i < array.length; i++) {  // Uses array.length in each iteration
            // Do something
            stateVar += i;
        }
    }
    
    // Memory vs calldata - GAS-03
    function externalWithMemory(string[] memory data) external pure returns (uint) {
        return data.length;
    }
}