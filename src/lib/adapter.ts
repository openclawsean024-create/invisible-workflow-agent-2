/**
 * NextAuth adapter using JSON file storage.
 * Implements the required Adapter interface for NextAuth v4.
 */

import type { Adapter, AdapterUser } from 'next-auth/adapters';
import type { AdapterAccount } from 'next-auth/adapters';
import { storage } from './storage';

function toAdapterUser(user: any): AdapterUser {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
    name: user.name ?? null,
    image: user.image ?? null,
  };
}

export const adapter: Adapter = {
  createUser: (data: Omit<AdapterUser, 'id'>) =>
    storage.createUser(data as any).then((u) => toAdapterUser(u)) as unknown as Promise<AdapterUser>,

  getUser: (id: string) =>
    storage.getUser(id).then((u) => (u ? toAdapterUser(u) : null)) as unknown as Promise<AdapterUser | null>,

  getUserByEmail: (email: string) =>
    storage.getUserByEmail(email).then((u) => (u ? toAdapterUser(u) : null)) as unknown as Promise<AdapterUser | null>,

  getUserByAccount: (account: { provider: string; providerAccountId: string }) =>
    storage.getUserByAccount(account.provider, account.providerAccountId).then((u) =>
      u ? toAdapterUser(u) : null
    ) as unknown as Promise<AdapterUser | null>,

  updateUser: ({ id, ...data }: { id: string } & Partial<Omit<AdapterUser, 'id'>>) =>
    storage.updateUser(id, { ...data, emailVerified: (data as any).emailVerified?.toISOString?.() } as any).then(
      (u) => toAdapterUser(u)
    ) as unknown as Promise<AdapterUser>,

  deleteUser: (id: string) => storage.deleteUser(id) as unknown as Promise<void>,

  linkAccount: (data: AdapterAccount) => storage.linkAccount(data as any) as unknown as Promise<AdapterAccount>,

  unlinkAccount: async (account: { provider: string; providerAccountId: string }) => {
    const a = await storage.getAccount(account.provider, account.providerAccountId);
    if (a) await storage.deleteAccount(a.id);
    return a ? (a as unknown as AdapterAccount) : undefined;
  },


  createVerificationToken: (data: { identifier: string; token: string; expires: Date }) =>
    storage.createVerificationToken(data as any) as unknown as Promise<any>,

  useVerificationToken: (data: { identifier: string; token: string }) =>
    storage.useVerificationToken(data.identifier, data.token) as unknown as Promise<any>,
} satisfies Adapter;
