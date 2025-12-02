import type {
  Env,
  ApiResponse,
  CreateJobRequest,
  UpdateJobRequest,
  JobConfig,
  JobStatus,
  PingRecord,
  HeartbeatRequest,
  LoginRequest,
  LoginResponse,
} from './types';
import { createStorage } from './storage';
import { createTelegramNotifier } from './telegram';
import { checkForMissedHeartbeats } from './alertChecker';
import {
  getSessionToken,
  validateSession,
  createSession,
  deleteSession,
  verifyAdminPassword,
  createSessionCookie,
  createLogoutCookie,
} from './auth';

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers for development
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const storage = createStorage(env);

      // Authentication check (skip for public routes)
      const publicPaths = [
        '/api/heartbeat/',  // Heartbeat API must be public
        '/api/auth/login',  // Login endpoint
      ];
      const isStaticAsset = url.pathname.match(/\.(css|js|png|jpg|svg|ico|webp)$/);
      const isPublicRoute = publicPaths.some(path => url.pathname.startsWith(path));

      // Check authentication for protected routes
      if (!isPublicRoute && !isStaticAsset) {
        const sessionToken = getSessionToken(request);
        const session = await validateSession(sessionToken, env.CRONPULSE_KV);

        // Redirect to login if not authenticated (HTML requests)
        if (!session) {
          const acceptsHtml = request.headers.get('Accept')?.includes('text/html');
          if (acceptsHtml && !url.pathname.startsWith('/api/')) {
            // Serve login page for unauthenticated HTML requests
            return new Response(null, { status: 404 }); // Let SPA handle /login route
          }
          // Return 401 for API requests
          if (url.pathname.startsWith('/api/')) {
            return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
          }
        }
      }

      let response: Response;

      // Route API requests
      if (url.pathname.startsWith('/api/')) {
        // Authentication endpoints (public)
        if (url.pathname === '/api/auth/login' && request.method === 'POST') {
          response = await handleLogin(request, env);
        } else if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
          response = await handleLogout(request, env);
        } else if (url.pathname === '/api/auth/me' && request.method === 'GET') {
          response = await handleAuthMe(request, env);
        }
        // Job management endpoints (protected by middleware above)
        else if (url.pathname === '/api/jobs' && request.method === 'GET') {
          response = await handleGetJobs(storage);
        } else if (url.pathname === '/api/jobs' && request.method === 'POST') {
          response = await handleCreateJob(request, storage);
        } else if (
          url.pathname.match(/^\/api\/jobs\/[^/]+$/) &&
          request.method === 'GET'
        ) {
          const jobId = url.pathname.split('/').pop()!;
          response = await handleGetJob(jobId, storage);
        } else if (
          url.pathname.match(/^\/api\/jobs\/[^/]+$/) &&
          request.method === 'PUT'
        ) {
          const jobId = url.pathname.split('/').pop()!;
          response = await handleUpdateJob(jobId, request, storage);
        } else if (
          url.pathname.match(/^\/api\/jobs\/[^/]+$/) &&
          request.method === 'DELETE'
        ) {
          const jobId = url.pathname.split('/').pop()!;
          response = await handleDeleteJob(jobId, storage);
        } else if (
          url.pathname.match(/^\/api\/heartbeat\/[^/]+$/) &&
          request.method === 'POST'
        ) {
          const jobId = url.pathname.split('/').pop()!;
          response = await handleHeartbeat(jobId, request, storage);
        } else if (url.pathname === '/api/alerts' && request.method === 'GET') {
          response = await handleGetAlerts(storage);
        } else {
          response = jsonResponse({ success: false, error: 'Not found' }, 404);
        }
      } else {
        // Let Cloudflare serve static assets
        return new Response(null, { status: 404 });
      }

      // Add CORS headers to response
      const headers = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error',
        },
        500
      );
    }
  },

  async scheduled(_event, env, _ctx): Promise<void> {
    console.log('Running scheduled alert check...');
    const storage = createStorage(env);
    const telegramNotifier = createTelegramNotifier(env);

    try {
      const alerts = await checkForMissedHeartbeats(storage, telegramNotifier);
      console.log(`Alert check complete. Generated ${alerts.length} alerts.`);
    } catch (error) {
      console.error('Scheduled job error:', error);
    }
  },
} satisfies ExportedHandler<Env>;

// API Handlers

async function handleGetJobs(storage: ReturnType<typeof createStorage>) {
  const jobs = await storage.getAllJobsWithStatus();
  return jsonResponse<typeof jobs>({ success: true, data: jobs });
}

async function handleCreateJob(
  request: Request,
  storage: ReturnType<typeof createStorage>
) {
  const body = (await request.json()) as CreateJobRequest;

  // Validate input
  if (!body.name || !body.expectedInterval) {
    return jsonResponse(
      { success: false, error: 'Missing required fields: name, expectedInterval' },
      400
    );
  }

  // Create job
  const jobId = generateId();
  const now = new Date().toISOString();

  const config: JobConfig = {
    id: jobId,
    name: body.name,
    description: body.description,
    expectedInterval: body.expectedInterval,
    alertThreshold: body.alertThreshold || 300, // Default 5 minutes
    createdAt: now,
    updatedAt: now,
    tags: body.tags,
  };

  const status: JobStatus = {
    jobId,
    lastPingTime: now, // Initialize with creation time
    status: 'healthy',
    consecutiveMisses: 0,
    totalPings: 0,
  };

  await storage.setJobConfig(config);
  await storage.setJobStatus(status);

  return jsonResponse({ success: true, data: { config, status } }, 201);
}

async function handleGetJob(
  jobId: string,
  storage: ReturnType<typeof createStorage>
) {
  const job = await storage.getJobWithStatus(jobId);

  if (!job) {
    return jsonResponse({ success: false, error: 'Job not found' }, 404);
  }

  return jsonResponse({ success: true, data: job });
}

async function handleUpdateJob(
  jobId: string,
  request: Request,
  storage: ReturnType<typeof createStorage>
) {
  const config = await storage.getJobConfig(jobId);

  if (!config) {
    return jsonResponse({ success: false, error: 'Job not found' }, 404);
  }

  const body = (await request.json()) as UpdateJobRequest;

  const updatedConfig: JobConfig = {
    ...config,
    name: body.name ?? config.name,
    description: body.description ?? config.description,
    expectedInterval: body.expectedInterval ?? config.expectedInterval,
    alertThreshold: body.alertThreshold ?? config.alertThreshold,
    tags: body.tags ?? config.tags,
    updatedAt: new Date().toISOString(),
  };

  await storage.setJobConfig(updatedConfig);

  return jsonResponse({ success: true, data: updatedConfig });
}

async function handleDeleteJob(
  jobId: string,
  storage: ReturnType<typeof createStorage>
) {
  const config = await storage.getJobConfig(jobId);

  if (!config) {
    return jsonResponse({ success: false, error: 'Job not found' }, 404);
  }

  await storage.deleteJob(jobId);

  return jsonResponse({ success: true, data: { deleted: jobId } });
}

async function handleHeartbeat(
  jobId: string,
  request: Request,
  storage: ReturnType<typeof createStorage>
) {
  const status = await storage.getJobStatus(jobId);

  if (!status) {
    return jsonResponse({ success: false, error: 'Job not found' }, 404);
  }

  const body = (await request.json().catch(() => ({}))) as HeartbeatRequest;
  const now = new Date().toISOString();

  // Update status
  const updatedStatus: JobStatus = {
    ...status,
    lastPingTime: now,
    status: 'healthy',
    consecutiveMisses: 0,
    totalPings: status.totalPings + 1,
  };

  await storage.setJobStatus(updatedStatus);

  // Add to history
  const pingRecord: PingRecord = {
    timestamp: now,
    status: 'success',
    metadata: body.metadata,
  };

  await storage.addPingRecord(jobId, pingRecord);

  return jsonResponse({ success: true, data: { received: now } });
}

async function handleGetAlerts(storage: ReturnType<typeof createStorage>) {
  const alerts = await storage.getAlerts(50);
  return jsonResponse({ success: true, data: alerts });
}

// Authentication Handlers

async function handleLogin(request: Request, env: Env): Promise<Response> {
  try {
    const body = (await request.json()) as LoginRequest;

    if (!body.password) {
      return jsonResponse<LoginResponse>(
        { success: false, error: 'Password required' },
        400
      );
    }

    // Verify password
    const isValid = await verifyAdminPassword(body.password, env);
    if (!isValid) {
      return jsonResponse<LoginResponse>(
        { success: false, error: 'Invalid password' },
        401
      );
    }

    // Create session
    const session = await createSession('admin', env.CRONPULSE_KV);

    // Create response with session cookie
    const response = jsonResponse<LoginResponse>({ success: true });
    const headers = new Headers(response.headers);
    headers.set('Set-Cookie', createSessionCookie(session.id));

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    return jsonResponse<LoginResponse>(
      { success: false, error: 'Login failed' },
      500
    );
  }
}

async function handleLogout(request: Request, env: Env): Promise<Response> {
  const sessionToken = getSessionToken(request);

  if (sessionToken) {
    await deleteSession(sessionToken, env.CRONPULSE_KV);
  }

  const response = jsonResponse({ success: true });
  const headers = new Headers(response.headers);
  headers.set('Set-Cookie', createLogoutCookie());

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

async function handleAuthMe(request: Request, env: Env): Promise<Response> {
  const sessionToken = getSessionToken(request);
  const session = await validateSession(sessionToken, env.CRONPULSE_KV);

  if (!session) {
    return jsonResponse({ success: false, error: 'Not authenticated' }, 401);
  }

  return jsonResponse({
    success: true,
    data: {
      userId: session.userId,
      expiresAt: session.expiresAt,
    },
  });
}

// Utilities

function jsonResponse<T>(data: ApiResponse<T>, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function generateId(): string {
  return `job-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
