import type { Env } from './types';

/**
 * Password hashing using PBKDF2 (Web Crypto API)
 */
export async function hashPassword(password: string): Promise<string> {
	const encoder = new TextEncoder();
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const passwordBuffer = encoder.encode(password);

	// Import password as key
	const key = await crypto.subtle.importKey(
		'raw',
		passwordBuffer,
		{ name: 'PBKDF2' },
		false,
		['deriveBits']
	);

	// Derive hash using PBKDF2
	const hashBuffer = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt,
			iterations: 100000,
			hash: 'SHA-256',
		},
		key,
		256
	);

	// Convert to base64
	const saltBase64 = btoa(String.fromCharCode(...salt));
	const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));

	return `$pbkdf2$100000$${saltBase64}$${hashBase64}`;
}

/**
 * Verify password against hash
 */
export async function verifyPassword(
	password: string,
	storedHash: string
): Promise<boolean> {
	const parts = storedHash.split('$');
	if (parts.length !== 4 || parts[0] !== '' || parts[1] !== 'pbkdf2') {
		return false;
	}

	const iterations = parseInt(parts[2], 10);
	const salt = Uint8Array.from(atob(parts[3]), (c) => c.charCodeAt(0));
	const expectedHash = parts[4];

	const encoder = new TextEncoder();
	const passwordBuffer = encoder.encode(password);

	const key = await crypto.subtle.importKey(
		'raw',
		passwordBuffer,
		{ name: 'PBKDF2' },
		false,
		['deriveBits']
	);

	const hashBuffer = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt,
			iterations,
			hash: 'SHA-256',
		},
		key,
		256
	);

	const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
	return hashBase64 === expectedHash;
}

/**
 * Generate cryptographically secure random session token
 */
export function generateSessionToken(): string {
	const buffer = crypto.getRandomValues(new Uint8Array(32));
	return btoa(String.fromCharCode(...buffer))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

/**
 * Session interface
 */
export interface Session {
	id: string;
	userId: string;
	createdAt: string;
	expiresAt: string;
}

/**
 * Create a new session
 */
export async function createSession(
	userId: string,
	kv: KVNamespace
): Promise<Session> {
	const token = generateSessionToken();
	const now = Date.now();
	const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

	const session: Session = {
		id: token,
		userId,
		createdAt: new Date(now).toISOString(),
		expiresAt: new Date(expiresAt).toISOString(),
	};

	// Store in KV with TTL
	await kv.put(`session:${token}`, JSON.stringify(session), {
		expirationTtl: 7 * 24 * 60 * 60, // 7 days in seconds
	});

	return session;
}

/**
 * Validate session token and return session if valid
 */
export async function validateSession(
	token: string | null,
	kv: KVNamespace
): Promise<Session | null> {
	if (!token) {
		return null;
	}

	const sessionData = await kv.get<Session>(`session:${token}`, 'json');
	if (!sessionData) {
		return null;
	}

	// Check expiration
	const expiresAt = new Date(sessionData.expiresAt).getTime();
	if (Date.now() > expiresAt) {
		await kv.delete(`session:${token}`);
		return null;
	}

	return sessionData;
}

/**
 * Delete session (logout)
 */
export async function deleteSession(
	token: string,
	kv: KVNamespace
): Promise<void> {
	await kv.delete(`session:${token}`);
}

/**
 * Parse cookies from request headers
 */
export function parseCookies(cookieHeader: string | null): Record<string, string> {
	const cookies: Record<string, string> = {};
	if (!cookieHeader) {
		return cookies;
	}

	cookieHeader.split(';').forEach((cookie) => {
		const [name, ...rest] = cookie.split('=');
		const value = rest.join('=').trim();
		if (name && value) {
			cookies[name.trim()] = decodeURIComponent(value);
		}
	});

	return cookies;
}

/**
 * Get session token from request cookies
 */
export function getSessionToken(request: Request): string | null {
	const cookieHeader = request.headers.get('Cookie');
	const cookies = parseCookies(cookieHeader);
	return cookies['session_token'] || null;
}

/**
 * Create session cookie header
 */
export function createSessionCookie(token: string, maxAge: number = 604800): string {
	// maxAge in seconds, default 7 days
	return `session_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

/**
 * Create logout cookie header (clears session)
 */
export function createLogoutCookie(): string {
	return 'session_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0';
}

/**
 * Verify admin password
 */
export async function verifyAdminPassword(
	password: string,
	env: Env
): Promise<boolean> {
	// If no password hash is set, hash the ADMIN_PASSWORD and compare
	if (env.ADMIN_PASSWORD_HASH) {
		return await verifyPassword(password, env.ADMIN_PASSWORD_HASH);
	}

	// Fallback: direct comparison with ADMIN_PASSWORD (less secure, for setup)
	// This allows first-time login before hash is set
	if (env.ADMIN_PASSWORD) {
		return password === env.ADMIN_PASSWORD;
	}

	return false;
}
