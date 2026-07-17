// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title PorchRegistry — permissionless directory of Porch RPC nodes (V1).
/// @notice Nodes self-register (msg.sender = the node's key); operators pay their own gas.
///         Capability flags are UNVERIFIED HINTS until a node actually delivers — a wallet
///         should treat them as advertising, and verify correctness itself (V1 = Merkle
///         proof + light-client verification). No stake or slashing in this version; a
///         non-slashable stake-to-be-featured is an optional later add (decision #28/#29).
contract PorchRegistry {
    struct Node {
        address operator; // msg.sender that registered
        string endpoint; // e.g. "https://home-a.example:8646" or an .onion address
        uint32 capabilities; // bitfield of CAP_* hints
        uint64 updatedAt; // block timestamp of last register/update
        bool active; // false after deregister
    }

    // Capability hint bits (advertised, not proven).
    uint32 public constant CAP_REAL_NODE = 1 << 0; // serves from its own full node
    uint32 public constant CAP_PROOF_BACK = 1 << 1; // returns eth_getProof (V1 correctness)
    uint32 public constant CAP_PIR = 1 << 2; // Content privacy (V2)
    uint32 public constant CAP_PROXY = 1 << 3; // proxies an upstream RPC (toy / not self-sourced)

    mapping(address => Node) public nodes;
    address[] public operators; // append-only enumeration set
    mapping(address => bool) private _known;

    event NodeRegistered(address indexed operator, string endpoint, uint32 capabilities);
    event NodeUpdated(address indexed operator, string endpoint, uint32 capabilities);
    event NodeDeregistered(address indexed operator);

    /// @notice Register or update the caller's node entry.
    function register(string calldata endpoint, uint32 capabilities) external {
        require(bytes(endpoint).length != 0, "endpoint required");
        Node storage n = nodes[msg.sender];
        bool wasActive = n.active;
        n.operator = msg.sender;
        n.endpoint = endpoint;
        n.capabilities = capabilities;
        n.updatedAt = uint64(block.timestamp);
        n.active = true;
        if (!_known[msg.sender]) {
            _known[msg.sender] = true;
            operators.push(msg.sender);
        }
        if (wasActive) {
            emit NodeUpdated(msg.sender, endpoint, capabilities);
        } else {
            emit NodeRegistered(msg.sender, endpoint, capabilities);
        }
    }

    /// @notice Mark the caller's node inactive (entry retained; can re-register later).
    function deregister() external {
        require(nodes[msg.sender].active, "not active");
        nodes[msg.sender].active = false;
        nodes[msg.sender].updatedAt = uint64(block.timestamp);
        emit NodeDeregistered(msg.sender);
    }

    /// @notice Total operators ever seen (active or not).
    function operatorCount() external view returns (uint256) {
        return operators.length;
    }

    /// @notice Enumerate active nodes. Fine for small N; large deployments should index
    ///         the events off-chain instead of calling this on-chain.
    function activeNodes() external view returns (Node[] memory list) {
        uint256 total = operators.length;
        uint256 count;
        for (uint256 i; i < total; ++i) {
            if (nodes[operators[i]].active) ++count;
        }
        list = new Node[](count);
        uint256 j;
        for (uint256 i; i < total; ++i) {
            Node storage nd = nodes[operators[i]];
            if (nd.active) {
                list[j++] = nd;
            }
        }
    }
}
