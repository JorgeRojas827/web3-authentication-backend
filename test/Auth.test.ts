import { expect } from "chai";
import { ethers } from "hardhat";
import { Auth } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

function createLoginMessage(address: string): string {
  return `Sign this message to authenticate: ${address.toLowerCase()}`;
}

describe("Auth Contract", function () {
  let auth: Auth;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let message: string;
  let signature: string;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const Auth = await ethers.getContractFactory("Auth");
    auth = await Auth.deploy();

    message = createLoginMessage(user.address);
    signature = await user.signMessage(message);
  });

  describe("verifySignature", function () {
    it("should authenticate user with valid signature", async function () {
      const tx = await auth.connect(user).verifySignature(message, signature);
      await tx.wait();

      const authStatus = await auth.authenticatedUsers(user.address);
      expect(authStatus).to.equal(1);
    });

    it("should emit UserAuthenticated event", async function () {
      const tx = await auth.connect(user).verifySignature(message, signature);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(auth, "UserAuthenticated")
        .withArgs(user.address, block!.timestamp);
    });

    it("should reject invalid signatures", async function () {
      const wrongSignature = await owner.signMessage(message);
      await expect(
        auth.connect(user).verifySignature(message, wrongSignature)
      ).to.be.revertedWithCustomError(auth, "InvalidSignature");
    });

    it("should reject invalid message format", async function () {
      const invalidMessage = "Invalid message format";
      const invalidSignature = await user.signMessage(invalidMessage);

      await expect(
        auth.connect(user).verifySignature(invalidMessage, invalidSignature)
      ).to.be.revertedWithCustomError(auth, "InvalidMessageFormat");
    });

    it("should reject invalid signature length", async function () {
      const invalidSignature = "0x1234";
      await expect(
        auth.connect(user).verifySignature(message, invalidSignature)
      ).to.be.revertedWithCustomError(auth, "InvalidSignatureLength");
    });

    it("should prevent replay attacks", async function () {
      await auth.connect(user).verifySignature(message, signature);

      await expect(
        auth.connect(user).verifySignature(message, signature)
      ).to.be.revertedWithCustomError(auth, "SignatureAlreadyUsed");
    });
  });

  describe("revokeAuthentication", function () {
    beforeEach(async function () {
      await auth.connect(user).verifySignature(message, signature);
    });

    it("should allow users to revoke authentication", async function () {
      const tx = await auth.connect(user).revokeAuthentication();
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      const authStatus = await auth.authenticatedUsers(user.address);
      expect(authStatus).to.equal(0);

      await expect(tx)
        .to.emit(auth, "AuthenticationRevoked")
        .withArgs(user.address, block!.timestamp);
    });
  });

  describe("authenticatedUsers", function () {
    it("should return 0 for non-authenticated users", async function () {
      const authStatus = await auth.authenticatedUsers(user.address);
      expect(authStatus).to.equal(0);
    });

    it("should maintain authentication state", async function () {
      await auth.connect(user).verifySignature(message, signature);

      expect(await auth.authenticatedUsers(user.address)).to.equal(1);
      expect(await auth.authenticatedUsers(owner.address)).to.equal(0);
    });
  });
});
