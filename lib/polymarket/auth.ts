// Polymarket Authentication Utilities
// Based on https://docs.polymarket.com/api-reference/authentication

import { Wallet } from 'ethers';
import { POLYMARKET_CONFIG, getPolyEnv } from './config';

export interface ApiCredentials {
  key: string; // SDK uses 'key' not 'apiKey'
  secret: string;
  passphrase: string;
}

/**
 * L1 Authentication: Creates or derives API credentials using private key
 * This should only be called server-side
 */
export async function createOrDeriveCredentials(
  privateKey: string,
  nonce: number = 0
): Promise<ApiCredentials> {
  try {
    const { ClobClient } = await import('@polymarket/clob-client-v2');
    
    const wallet = new Wallet(privateKey);
    
    const client = new ClobClient({
      host: POLYMARKET_CONFIG.CLOB_API_BASE,
      chain: POLYMARKET_CONFIG.CHAIN_ID,
      signer: wallet,
    });

    const credentials = await client.createOrDeriveApiKey();
    
    return {
      key: credentials.key,
      secret: credentials.secret,
      passphrase: credentials.passphrase,
    };
  } catch (error) {
    console.error('Failed to create/derive API credentials:', error);
    throw new Error('Authentication failed: Unable to create API credentials');
  }
}

/**
 * Get API credentials from environment variables
 * For production use, these should be pre-generated and stored securely
 */
export function getEnvCredentials(): ApiCredentials | null {
  const env = getPolyEnv();
  
  if (!env.apiKey || !env.apiSecret || !env.passphrase) {
    return null;
  }

  return {
    key: env.apiKey,
    secret: env.apiSecret,
    passphrase: env.passphrase,
  };
}

/**
 * Create an authenticated CLOB client for trading operations
 * This should only be called server-side
 */
export async function createAuthenticatedClient(
  privateKey?: string,
  signatureType: number = 2 // GNOSIS_SAFE (most common)
) {
  try {
    const { ClobClient } = await import('@polymarket/clob-client-v2');
    
    const env = getPolyEnv();
    const creds = getEnvCredentials();
    
    if (!creds) {
      throw new Error('API credentials not found in environment variables');
    }

    const wallet = privateKey ? new Wallet(privateKey) : new Wallet(env.privateKey!);
    
    const client = new ClobClient({
      host: POLYMARKET_CONFIG.CLOB_API_BASE,
      chain: POLYMARKET_CONFIG.CHAIN_ID,
      signer: wallet,
      creds: creds,
      signatureType: signatureType,
      funderAddress: env.funderAddress,
    });

    return client;
  } catch (error) {
    console.error('Failed to create authenticated client:', error);
    throw new Error('Authentication failed: Unable to create authenticated client');
  }
}

/**
 * Create a public CLOB client for read-only operations (no auth required)
 */
export async function createPublicClient() {
  try {
    const { ClobClient } = await import('@polymarket/clob-client-v2');
    
    const client = new ClobClient({
      host: POLYMARKET_CONFIG.CLOB_API_BASE,
      chain: POLYMARKET_CONFIG.CHAIN_ID,
    });

    return client;
  } catch (error) {
    console.error('Failed to create public client:', error);
    throw new Error('Failed to create public CLOB client');
  }
}

/**
 * Validate if a wallet address is a valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
  try {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  } catch {
    return false;
  }
}

/**
 * Get signature type from string or number
 */
export function getSignatureType(type: string | number): number {
  if (typeof type === 'number') {
    if (type >= 0 && type <= 2) {
      return type;
    }
  }
  
  const typeStr = String(type).toLowerCase();
  switch (typeStr) {
    case 'eoa':
    case '0':
      return 0;
    case 'poly_proxy':
    case '1':
      return 1;
    case 'gnosis_safe':
    case '2':
    default:
      return 2;
  }
}
