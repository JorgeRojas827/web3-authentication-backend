import { ethers } from "hardhat";

async function main() {
  const Auth = await ethers.getContractFactory("Auth");
  const auth = await Auth.deploy();

  await auth.waitForDeployment();
  const address = await auth.getAddress();

  await auth.deploymentTransaction()?.wait(5);

  await hre.run("verify:verify", {
    address: address,
    constructorArguments: [],
  });
}

main().catch((error) => {
  process.exitCode = 1;
});
