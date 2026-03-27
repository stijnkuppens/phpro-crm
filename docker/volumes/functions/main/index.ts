Deno.serve(() => new Response(JSON.stringify({ message: 'ok' }), {
  headers: { 'Content-Type': 'application/json' },
}))
