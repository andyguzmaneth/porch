// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {PorchRegistry} from "../src/PorchRegistry.sol";

/// @notice Deploy PorchRegistry. Local:
///   anvil &
///   forge script script/DeployRegistry.s.sol --rpc-url http://localhost:8545 --broadcast \
///     --private-key <anvil key 0>
contract DeployRegistry is Script {
    function run() external returns (PorchRegistry reg) {
        vm.startBroadcast();
        reg = new PorchRegistry();
        vm.stopBroadcast();
        console.log("PorchRegistry deployed at", address(reg));
    }
}
