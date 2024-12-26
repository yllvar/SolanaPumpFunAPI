import { ComputeBudgetProgram, Keypair } from '@solana/web3.js';
import { Connection, PublicKey, Transaction, TransactionInstruction, sendAndConfirmTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

export async function getKeyPairFromPrivateKey(key: string) {
    try {
        const decodedKey = bs58.decode(key);
        if (decodedKey.length !== 64) {
            throw new Error('Invalid private key length');
        }
        const keypair = Keypair.fromSecretKey(decodedKey);
        console.log('Generated public key:', keypair.publicKey.toString());
        return keypair;
    } catch (error) {
        console.error('Error generating keypair:', error);
        throw new Error('Failed to generate keypair from private key');
    }
}

export async function createTransaction(
  connection: Connection,
  instructions: TransactionInstruction[],
  payer: PublicKey,
  priorityFeeInSol: number = 0
): Promise<Transaction> {
  const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: 1000000,
  });

  const transaction = new Transaction().add(modifyComputeUnits);

  if (priorityFeeInSol > 0) {
      const microLamports = priorityFeeInSol * 1_000_000_000; // convert SOL to microLamports
      const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
          microLamports,
      });
      transaction.add(addPriorityFee);
  }

  transaction.add(...instructions);

  transaction.feePayer = payer;
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  return transaction;
}

export async function sendAndConfirmTransactionWrapper(connection: Connection, transaction: Transaction, signers: any[]) {
    try {
        const signature = await sendAndConfirmTransaction(connection, transaction, signers, { skipPreflight: true, preflightCommitment: 'processed' });
        return signature;
    } catch (error) {
        console.error('Error in sendAndConfirmTransactionWrapper:', error);
        throw error;
    }
}

export function bufferFromUInt64(num: string | number): Buffer {
    const buffer = Buffer.alloc(8);
    if (typeof num === 'string') {
        buffer.writeBigUInt64LE(BigInt(num));
    } else {
        buffer.writeBigUInt64LE(BigInt(num));
    }
    return buffer;
}

