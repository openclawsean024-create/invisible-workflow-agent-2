/**
 * JSON file-based storage for Vercel deployment.
 * Replaces Prisma+PostgreSQL with a file-based store.
 */

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const VERIFICATION_TOKENS_FILE = path.join(DATA_DIR, 'verification_tokens.json');
const TOOL_CONNECTIONS_FILE = path.join(DATA_DIR, 'tool_connections.json');
const RULES_FILE = path.join(DATA_DIR, 'rules.json');
const EXECUTIONS_FILE = path.join(DATA_DIR, 'executions.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonFile<T>(filePath: string, defaultValue: T): T {
  ensureDataDir();
  if (!fs.existsSync(filePath)) {
    return defaultValue;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return defaultValue;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DbUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  emailVerified?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbAccount {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
}

export interface DbSession {
  id: string;
  sessionToken: string;
  userId: string;
  expires: string;
}

export interface DbVerificationToken {
  identifier: string;
  token: string;
  expires: string;
}

export interface DbToolConnection {
  id: string;
  userId: string;
  toolId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  accountId?: string;
  accountName?: string;
  connected: boolean;
  connectedAt?: string;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbRule {
  id: string;
  userId: string;
  name: string;
  trigger: string;
  condition: string; // JSON string
  action: string; // JSON string
  schedule?: string;
  enabled: boolean;
  lastRunAt?: string;
  runCount: number;
  successCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DbExecution {
  id: string;
  ruleId: string;
  userId: string;
  status: 'success' | 'failed' | 'running';
  details?: string;
  startedAt: string;
  completedAt?: string;
  workflowId?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cuid(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `c${timestamp}${randomPart}`;
}

function now(): string {
  return new Date().toISOString();
}

// ─── Users ───────────────────────────────────────────────────────────────────

export const storage = {
  // User operations
  async getUser(id: string): Promise<DbUser | null> {
    const users = readJsonFile<DbUser[]>(USERS_FILE, []);
    return users.find(u => u.id === id) ?? null;
  },

  async getUserByEmail(email: string): Promise<DbUser | null> {
    const users = readJsonFile<DbUser[]>(USERS_FILE, []);
    return users.find(u => u.email === email) ?? null;
  },

  async getUserByAccount(provider: string, providerAccountId: string): Promise<DbUser | null> {
    const accounts = readJsonFile<DbAccount[]>(ACCOUNTS_FILE, []);
    const account = accounts.find(a => a.provider === provider && a.providerAccountId === providerAccountId);
    if (!account) return null;
    return this.getUser(account.userId);
  },

  async createUser(data: { email: string; name?: string; image?: string; emailVerified?: string }): Promise<DbUser> {
    const users = readJsonFile<DbUser[]>(USERS_FILE, []);
    const user: DbUser = {
      id: cuid(),
      email: data.email,
      name: data.name,
      image: data.image,
      createdAt: now(),
      updatedAt: now(),
    };
    users.push(user);
    writeJsonFile(USERS_FILE, users);
    return user;
  },

  async updateUser(id: string, data: Partial<Omit<DbUser, 'id' | 'createdAt'>>): Promise<DbUser> {
    const users = readJsonFile<DbUser[]>(USERS_FILE, []);
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found');
    users[idx] = { ...users[idx], ...data, updatedAt: now() };
    writeJsonFile(USERS_FILE, users);
    return users[idx];
  },

  async deleteUser(id: string): Promise<void> {
    const users = readJsonFile<DbUser[]>(USERS_FILE, []);
    writeJsonFile(USERS_FILE, users.filter(u => u.id !== id));
    // Cascade deletes
    const accounts = readJsonFile<DbAccount[]>(ACCOUNTS_FILE, []);
    writeJsonFile(ACCOUNTS_FILE, accounts.filter(a => a.userId !== id));
    const sessions = readJsonFile<DbSession[]>(SESSIONS_FILE, []);
    writeJsonFile(SESSIONS_FILE, sessions.filter(s => s.userId !== id));
    const toolConnections = readJsonFile<DbToolConnection[]>(TOOL_CONNECTIONS_FILE, []);
    writeJsonFile(TOOL_CONNECTIONS_FILE, toolConnections.filter(tc => tc.userId !== id));
    const rules = readJsonFile<DbRule[]>(RULES_FILE, []);
    writeJsonFile(RULES_FILE, rules.filter(r => r.userId !== id));
    const executions = readJsonFile<DbExecution[]>(EXECUTIONS_FILE, []);
    writeJsonFile(EXECUTIONS_FILE, executions.filter(e => e.userId !== id));
  },

  // Account operations (OAuth)
  async linkAccount(data: Omit<DbAccount, 'id'>): Promise<DbAccount> {
    const accounts = readJsonFile<DbAccount[]>(ACCOUNTS_FILE, []);
    const account: DbAccount = { id: cuid(), ...data };
    accounts.push(account);
    writeJsonFile(ACCOUNTS_FILE, accounts);
    return account;
  },

  async getAccount(provider: string, providerAccountId: string): Promise<DbAccount | null> {
    const accounts = readJsonFile<DbAccount[]>(ACCOUNTS_FILE, []);
    return accounts.find(a => a.provider === provider && a.providerAccountId === providerAccountId) ?? null;
  },

  async getAccountsByUserId(userId: string): Promise<DbAccount[]> {
    return readJsonFile<DbAccount[]>(ACCOUNTS_FILE, []).filter(a => a.userId === userId);
  },

  async deleteAccount(id: string): Promise<void> {
    const accounts = readJsonFile<DbAccount[]>(ACCOUNTS_FILE, []);
    writeJsonFile(ACCOUNTS_FILE, accounts.filter(a => a.id !== id));
  },

  // Session operations
  async createSession(data: Omit<DbSession, 'id'>): Promise<DbSession> {
    const sessions = readJsonFile<DbSession[]>(SESSIONS_FILE, []);
    const session: DbSession = { id: cuid(), ...data };
    sessions.push(session);
    writeJsonFile(SESSIONS_FILE, sessions);
    return session;
  },

  async getSession(sessionToken: string): Promise<DbSession | null> {
    const sessions = readJsonFile<DbSession[]>(SESSIONS_FILE, []);
    return sessions.find(s => s.sessionToken === sessionToken) ?? null;
  },

  async deleteSession(sessionToken: string): Promise<void> {
    const sessions = readJsonFile<DbSession[]>(SESSIONS_FILE, []);
    writeJsonFile(SESSIONS_FILE, sessions.filter(s => s.sessionToken !== sessionToken));
  },

  // Verification tokens
  async createVerificationToken(data: DbVerificationToken): Promise<DbVerificationToken> {
    const tokens = readJsonFile<DbVerificationToken[]>(VERIFICATION_TOKENS_FILE, []);
    tokens.push(data);
    writeJsonFile(VERIFICATION_TOKENS_FILE, tokens);
    return data;
  },

  async useVerificationToken(identifier: string, token: string): Promise<DbVerificationToken | null> {
    const tokens = readJsonFile<DbVerificationToken[]>(VERIFICATION_TOKENS_FILE, []);
    const idx = tokens.findIndex(t => t.identifier === identifier && t.token === token);
    if (idx === -1) return null;
    const used = tokens.splice(idx, 1)[0];
    writeJsonFile(VERIFICATION_TOKENS_FILE, tokens);
    return used;
  },

  // Tool Connections
  async getToolConnectionsByUserId(userId: string): Promise<DbToolConnection[]> {
    return readJsonFile<DbToolConnection[]>(TOOL_CONNECTIONS_FILE, []).filter(tc => tc.userId === userId);
  },

  async getToolConnection(userId: string, toolId: string): Promise<DbToolConnection | null> {
    return readJsonFile<DbToolConnection[]>(TOOL_CONNECTIONS_FILE, [])
      .find(tc => tc.userId === userId && tc.toolId === toolId) ?? null;
  },

  async upsertToolConnection(userId: string, toolId: string, data: Partial<DbToolConnection>): Promise<DbToolConnection> {
    const connections = readJsonFile<DbToolConnection[]>(TOOL_CONNECTIONS_FILE, []);
    const idx = connections.findIndex(tc => tc.userId === userId && tc.toolId === toolId);
    const nowStr = now();
    if (idx >= 0) {
      connections[idx] = { ...connections[idx], ...data, updatedAt: nowStr };
      writeJsonFile(TOOL_CONNECTIONS_FILE, connections);
      return connections[idx];
    } else {
      const newConn: DbToolConnection = {
        id: cuid(),
        userId,
        toolId,
        connected: false,
        createdAt: nowStr,
        updatedAt: nowStr,
        ...data,
      };
      connections.push(newConn);
      writeJsonFile(TOOL_CONNECTIONS_FILE, connections);
      return newConn;
    }
  },

  async deleteToolConnection(userId: string, toolId: string): Promise<void> {
    const connections = readJsonFile<DbToolConnection[]>(TOOL_CONNECTIONS_FILE, []);
    writeJsonFile(TOOL_CONNECTIONS_FILE, connections.filter(tc => !(tc.userId === userId && tc.toolId === toolId)));
  },

  // Rules
  async listRules(userId?: string): Promise<DbRule[]> {
    const rules = readJsonFile<DbRule[]>(RULES_FILE, []);
    if (userId) return rules.filter(r => r.userId === userId);
    return rules;
  },

  async getRule(id: string): Promise<DbRule | null> {
    return readJsonFile<DbRule[]>(RULES_FILE, []).find(r => r.id === id) ?? null;
  },

  async createRule(data: Omit<DbRule, 'id' | 'createdAt' | 'updatedAt' | 'runCount' | 'successCount'>): Promise<DbRule> {
    const rules = readJsonFile<DbRule[]>(RULES_FILE, []);
    const nowStr = now();
    const rule: DbRule = {
      id: cuid(),
      runCount: 0,
      successCount: 0,
      createdAt: nowStr,
      updatedAt: nowStr,
      ...data,
    };
    rules.push(rule);
    writeJsonFile(RULES_FILE, rules);
    return rule;
  },

  async updateRule(id: string, data: Partial<Omit<DbRule, 'id' | 'createdAt'>>): Promise<DbRule> {
    const rules = readJsonFile<DbRule[]>(RULES_FILE, []);
    const idx = rules.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Rule not found');
    rules[idx] = { ...rules[idx], ...data, updatedAt: now() };
    writeJsonFile(RULES_FILE, rules);
    return rules[idx];
  },

  async deleteRule(id: string): Promise<void> {
    const rules = readJsonFile<DbRule[]>(RULES_FILE, []);
    writeJsonFile(RULES_FILE, rules.filter(r => r.id !== id));
    // Cascade delete executions
    const executions = readJsonFile<DbExecution[]>(EXECUTIONS_FILE, []);
    writeJsonFile(EXECUTIONS_FILE, executions.filter(e => e.ruleId !== id));
  },

  // Executions
  async listExecutions(userId: string, options?: { status?: string; ruleId?: string; limit?: number }): Promise<DbExecution[]> {
    let executions = readJsonFile<DbExecution[]>(EXECUTIONS_FILE, [])
      .filter(e => e.userId === userId);
    if (options?.status) executions = executions.filter(e => e.status === options.status);
    if (options?.ruleId) executions = executions.filter(e => e.ruleId === options.ruleId);
    executions.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    if (options?.limit) executions = executions.slice(0, options.limit);
    return executions;
  },

  async getExecution(id: string): Promise<DbExecution | null> {
    return readJsonFile<DbExecution[]>(EXECUTIONS_FILE, []).find(e => e.id === id) ?? null;
  },

  async createExecution(data: Omit<DbExecution, 'id'>): Promise<DbExecution> {
    const executions = readJsonFile<DbExecution[]>(EXECUTIONS_FILE, []);
    const execution: DbExecution = { id: cuid(), ...data };
    executions.push(execution);
    writeJsonFile(EXECUTIONS_FILE, executions);
    return execution;
  },

  async updateExecution(id: string, data: Partial<DbExecution>): Promise<DbExecution> {
    const executions = readJsonFile<DbExecution[]>(EXECUTIONS_FILE, []);
    const idx = executions.findIndex(e => e.id === id);
    if (idx === -1) throw new Error('Execution not found');
    executions[idx] = { ...executions[idx], ...data };
    writeJsonFile(EXECUTIONS_FILE, executions);
    return executions[idx];
  },
};
