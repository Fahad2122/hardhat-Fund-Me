const { ethers, network, getNamedAccounts, deployments } = require("hardhat");
const { deploymentChains } = require("../../helper-hardhat-config");
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace");
const { assert } = require("chai");

deploymentChains.includes(network.name) ? describe.skip :
describe("FundMe", function () {
    let fundMe;
    let fundMeAddress;
    
    const sendValue = ethers.parseEther('0.1');
    
    beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        fundMeAddress = (await deployments.get("FundMe")).address;
        fundMe = await ethers.getContractAt("FundMe", fundMeAddress);
    })

    it("allows people to fund and withdraw", async () => {
        const fundResponse = await fundMe.fund({ value: sendValue });
        await fundResponse.wait(1);
        const withdrawResponse = await fundMe.withdraw();
        await withdrawResponse.wait(1);

        const fundMeBalance = await ethers.provider.getBalance(fundMe.target);

        assert.equal(fundMeBalance.toString(), "0");
    })
})