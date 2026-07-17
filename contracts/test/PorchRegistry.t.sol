// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PorchRegistry} from "../src/PorchRegistry.sol";

contract PorchRegistryTest is Test {
    PorchRegistry reg;
    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    // Local mirrors of the contract's capability bits, so tests never make an external
    // call to `reg` while computing an argument (that would steal the prank/expectRevert).
    uint32 constant CAP_REAL_NODE = 1 << 0;
    uint32 constant CAP_PROOF_BACK = 1 << 1;
    uint32 constant CAP_PROXY = 1 << 3;
    uint32 constant CAPS = CAP_REAL_NODE | CAP_PROOF_BACK;

    event NodeRegistered(address indexed operator, string endpoint, uint32 capabilities);
    event NodeUpdated(address indexed operator, string endpoint, uint32 capabilities);
    event NodeDeregistered(address indexed operator);

    function setUp() public {
        reg = new PorchRegistry();
    }

    function test_capBitsMatchContract() public view {
        assertEq(reg.CAP_REAL_NODE(), CAP_REAL_NODE);
        assertEq(reg.CAP_PROOF_BACK(), CAP_PROOF_BACK);
        assertEq(reg.CAP_PROXY(), CAP_PROXY);
    }

    function test_registerEmitsAndStores() public {
        vm.expectEmit(true, false, false, true);
        emit NodeRegistered(alice, "https://home-a:8646", CAPS);
        vm.prank(alice);
        reg.register("https://home-a:8646", CAPS);

        (address op, string memory ep, uint32 caps,, bool active) = reg.nodes(alice);
        assertEq(op, alice);
        assertEq(ep, "https://home-a:8646");
        assertEq(caps, CAPS);
        assertTrue(active);
        assertEq(reg.operatorCount(), 1);
        assertEq(reg.activeNodes().length, 1);
    }

    function test_updateEmitsUpdated() public {
        vm.prank(alice);
        reg.register("https://home-a:8646", CAP_REAL_NODE);

        vm.expectEmit(true, false, false, true);
        emit NodeUpdated(alice, "https://home-a:9000", CAPS);
        vm.prank(alice);
        reg.register("https://home-a:9000", CAPS);

        (, string memory ep, uint32 caps,,) = reg.nodes(alice);
        assertEq(ep, "https://home-a:9000");
        assertEq(caps, CAPS);
        assertEq(reg.operatorCount(), 1); // not duplicated
        assertEq(reg.activeNodes().length, 1);
    }

    function test_deregisterRemovesFromActive() public {
        vm.prank(alice);
        reg.register("https://home-a:8646", CAPS);

        vm.expectEmit(true, false, false, false);
        emit NodeDeregistered(alice);
        vm.prank(alice);
        reg.deregister();

        (,,,, bool active) = reg.nodes(alice);
        assertFalse(active);
        assertEq(reg.activeNodes().length, 0);
        assertEq(reg.operatorCount(), 1); // entry retained
    }

    function test_twoNodesEnumerate() public {
        vm.prank(alice);
        reg.register("https://home-a:8646", CAPS);
        vm.prank(bob);
        reg.register("https://home-b:8646", CAP_PROXY);

        assertEq(reg.activeNodes().length, 2);
        assertEq(reg.operatorCount(), 2);
    }

    function test_reregisterAfterDeregister() public {
        vm.startPrank(alice);
        reg.register("https://home-a:8646", CAPS);
        reg.deregister();
        reg.register("https://home-a:8646", CAPS);
        vm.stopPrank();
        assertEq(reg.activeNodes().length, 1);
        assertEq(reg.operatorCount(), 1);
    }

    function test_revertEmptyEndpoint() public {
        vm.prank(alice);
        vm.expectRevert(bytes("endpoint required"));
        reg.register("", CAPS);
    }

    function test_revertDeregisterWhenNotActive() public {
        vm.prank(alice);
        vm.expectRevert(bytes("not active"));
        reg.deregister();
    }
}
