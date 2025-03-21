// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./utils/Strings.sol";
import "hardhat/console.sol";
/**
 * @title Auth
 * @dev Implements EIP-191 signature verification for user authentication
 * @notice This contract handles secure user authentication via cryptographic signatures
 */
contract Auth {
    // Use uint256 for gas optimization (1 for true, 0 for false)
    mapping(address => uint256) public authenticatedUsers;
    mapping(bytes32 => uint256) private usedSignatures;

    event UserAuthenticated(address indexed user, uint256 indexed timestamp);
    event AuthenticationRevoked(address indexed user, uint256 indexed timestamp);

    error InvalidMessageFormat();
    error InvalidSignature();
    error SignatureAlreadyUsed();
    error InvalidSignatureLength();
    error InvalidSignatureVersion();

    /**
     * @notice Verifies a signature and authenticates a user
     * @param message The signed message
     * @param signature The signature to verify
     * @return success True if authentication was successful
     */
    function verifySignature(
        string calldata message,
        bytes calldata signature
    ) external returns (bool success) {
        bytes32 messageHash = keccak256(bytes(message));
        if(usedSignatures[messageHash] == 1) revert SignatureAlreadyUsed();

        address sender = msg.sender;

        string memory expectedMessage = string.concat(
            "Sign this message to authenticate: ",
            Strings.toHexString(uint160(sender), 20)
        );

        if(keccak256(bytes(message)) != keccak256(bytes(expectedMessage))) {
            revert InvalidMessageFormat();
        }

        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n",
                Strings.toString(bytes(message).length),
                message
            )
        );

        if(_recoverSigner(ethSignedMessageHash, signature) != sender) {
            revert InvalidSignature();
        }

        usedSignatures[messageHash] = 1;
        authenticatedUsers[sender] = 1;
        emit UserAuthenticated(sender, block.timestamp);

        return true;
    }

    /**
     * @notice Revokes authentication for the caller
     * @dev Allows users to logout/deauthenticate
     */
    function revokeAuthentication() external {
        address sender = msg.sender;
        authenticatedUsers[sender] = 0;
        emit AuthenticationRevoked(sender, block.timestamp);
    }

    /**
     * @notice Recovers the address that signed a message
     * @param messageHash The hash of the signed message
     * @param signature The signature bytes
     * @return signer The address that created the signature
     */
    function _recoverSigner(
        bytes32 messageHash,
        bytes calldata signature
    ) internal pure returns (address signer) {
        if(signature.length != 65) revert InvalidSignatureLength();

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }

        if (v < 27) v += 27;
        if (v != 27 && v != 28) revert InvalidSignatureVersion();

        return ecrecover(messageHash, v, r, s);
    }
}
