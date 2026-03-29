const FUNCTIONS_PATH = '/home/deno/functions';

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  // Extract function name from path: /functions/v1/<name> or /<name>
  const functionName = url.pathname
    .replace(/^\/functions\/v1\//, '/')
    .split('/')
    .filter(Boolean)[0];

  if (!functionName) {
    return new Response(JSON.stringify({ message: 'ok' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const envVarsObj = Deno.env.toObject();
    const envVars = Object.keys(envVarsObj).map((k) => [k, envVarsObj[k]]);

    // deno-lint-ignore no-explicit-any
    const worker = await (globalThis as any).EdgeRuntime.userWorkers.create({
      servicePath: `${FUNCTIONS_PATH}/${functionName}`,
      memoryLimitMb: 150,
      workerTimeoutMs: 5 * 60 * 1000,
      noModuleCache: false,
      envVars,
      forceCreate: false,
    });
    return await worker.fetch(req);
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    if (error.includes('not found') || error.includes('ENOENT')) {
      return new Response(JSON.stringify({ error: `Function '${functionName}' not found` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.error(`Error invoking function '${functionName}':`, error);
    return new Response(JSON.stringify({ error }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
