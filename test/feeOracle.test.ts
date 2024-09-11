import { Emulator, Lucid, Tx as LTx } from "@anastasia-labs/lucid-cardano-fork";

import {
  LucidContext,
  initiateFeeOracle,
  FeeOracleInitiationOutcome,
  generateAccountSeedPhrase,
  lutxoToUTxO,
  getFeeUpdateTx,
  TIMEOUT
} from "./utils.ts";
import { Address } from "@harmoniclabs/plu-ts";
import { beforeEach, test, expect } from "vitest";

beforeEach<LucidContext>(async (context) => {
  const createUser = async () => {
    return await generateAccountSeedPhrase({ lovelace: BigInt(100_000_000) });
  };
  context.users = {
    owner: await createUser(),
    adversary: await createUser(),
  };

  context.emulator = new Emulator([
    context.users.owner,
    context.users.adversary, //use this user profile for the unhappy test path, adversary setting marketplace fee to 0% without having the Beacon UTxO
  ]);

  context.lucid = await Lucid.new(context.emulator);
});

test<LucidContext>("Test - Valid Update Fee Oracle", async ({
  lucid,
  users,
  emulator,
}) => {
  // Select the signer wallet
  lucid.selectWalletFromSeed(users.owner.seedPhrase);

  const feeOracleInitiationOutcome: FeeOracleInitiationOutcome =
    await initiateFeeOracle(emulator, lucid, users.owner.seedPhrase, false);

  const feeOracleScriptUTxO = feeOracleInitiationOutcome.feeOracleUTxOs[0];
  const beaconUTxO = feeOracleInitiationOutcome.feeOracleUTxOs[1];

  const ownerUTxOs = await lucid.wallet.getUtxos();
  const ownersFirstLUTxO = ownerUTxOs[0];
  const ownersFirstUTxO = lutxoToUTxO(ownersFirstLUTxO);

  const feeUpdateTx = await getFeeUpdateTx(
    30_000,
    ownersFirstUTxO,
    beaconUTxO,
    feeOracleScriptUTxO,
    true,
    false
  );

  // Sign and submit the fee update transaction
  const feeUpdateLTx = lucid.fromTx(feeUpdateTx.toCbor().toString());
  const signedFeeUpdateLTx = await feeUpdateLTx.sign().complete();
  const feeUpdateTxHash = await signedFeeUpdateLTx.submit();

  emulator.awaitBlock(50);
}, TIMEOUT); // Increased timeout to 120 seconds

test<LucidContext>("Test - Invalid Update Fee Oracle (Steal Beacon UTxO)", async ({
  lucid,
  users,
  emulator,
}) => {
  expect(async () => {
    const feeOracleInitiationOutcome: FeeOracleInitiationOutcome =
      await initiateFeeOracle(emulator, lucid, users.owner.seedPhrase, false);

    const feeOracleScriptUTxO = feeOracleInitiationOutcome.feeOracleUTxOs[0];
    const beaconUTxO = feeOracleInitiationOutcome.feeOracleUTxOs[1];

    lucid.selectWalletFromSeed(users.adversary.seedPhrase);
    const adversaryAddr = await lucid.wallet.address();
    const destinationAddress = Address.fromString(adversaryAddr);

    const adversaryUTxOs = await lucid.wallet.getUtxos();
    const adversaryFirstLUTxO = adversaryUTxOs[0];
    const adversaryFirstUTxO = lutxoToUTxO(adversaryFirstLUTxO);

    // Attempt to update fee and redirect the Beacon UTxO to the adversary's wallet
    const invalidFeeUpdateTx = await getFeeUpdateTx(
      30_000,
      adversaryFirstUTxO,
      beaconUTxO,
      feeOracleScriptUTxO,
      true,
      false, // Not using bad datum
      destinationAddress // Adversary's wallet address
    );

    // Sign and submit the fee update transaction
    const invalidFeeUpdateLTx = lucid.fromTx(
      invalidFeeUpdateTx.toCbor().toString()
    );
    const invalidSignedFeeUpdateLTx = await invalidFeeUpdateLTx
      .sign()
      .complete();
    const invalidFeeUpdateTxHash = await invalidSignedFeeUpdateLTx.submit();

    // Wait for the transaction
    emulator.awaitBlock(50);
  })
    .rejects.toThrow // Redirecting the Beacon UTxO to the adversary's wallet fails as intended
    ();
}, TIMEOUT);

test<LucidContext>("Test - Invalid Update Fee Oracle (Reproduce with Bad Datum)", async ({
  lucid,
  users,
  emulator,
}) => {
  expect(async () => {
    const feeOracleInitiationOutcome: FeeOracleInitiationOutcome =
      await initiateFeeOracle(emulator, lucid, users.owner.seedPhrase, false);

    const feeOracleScriptUTxO = feeOracleInitiationOutcome.feeOracleUTxOs[0];
    const beaconUTxO = feeOracleInitiationOutcome.feeOracleUTxOs[1];

    lucid.selectWalletFromSeed(users.adversary.seedPhrase);
    const adversaryAddr = await lucid.wallet.address();
    const destinationAddress = Address.fromString(adversaryAddr);

    const adversaryUTxOs = await lucid.wallet.getUtxos();
    const adversaryFirstLUTxO = adversaryUTxOs[0];
    const adversaryFirstUTxO = lutxoToUTxO(adversaryFirstLUTxO);

    // Attempt to update fee in a way that the datum is invalid
    const invalidFeeUpdateTx = await getFeeUpdateTx(
      30_000,
      adversaryFirstUTxO,
      beaconUTxO,
      feeOracleScriptUTxO,
      true,
      true // Creating a bad datum
    );

    // Sign and submit the fee update transaction
    const invalidFeeUpdateLTx = lucid.fromTx(
      invalidFeeUpdateTx.toCbor().toString()
    );
    const invalidSignedFeeUpdateLTx = await invalidFeeUpdateLTx
      .sign()
      .complete();
    const invalidFeeUpdateTxHash = await invalidSignedFeeUpdateLTx.submit();

    // Wait for the transaction
    emulator.awaitBlock(50);
  }).rejects.toThrow(
    "script consumed with Spend redemer and index '1'" // Bad Datum fails as intended
  );
}, TIMEOUT);
