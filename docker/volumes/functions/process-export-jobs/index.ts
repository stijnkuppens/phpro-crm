import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PROGRESS_BATCH = 500;

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Job ID comes from the request body (sent by pg_net trigger or retry)
    const body = await req.json().catch(() => ({}));
    const jobId = body.job_id;

    if (!jobId) {
      return new Response(JSON.stringify({ error: 'Missing job_id' }), { status: 400 });
    }

    await processExportJob(supabase, jobId);

    return new Response(JSON.stringify({ processed: jobId }), { status: 200 });
  } catch (err) {
    console.error('Edge function error:', err);
    const message = err instanceof Error ? err.message : 'Internal error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});

type SupabaseClient = ReturnType<typeof createClient>;

async function processExportJob(supabase: SupabaseClient, jobId: string) {
  // 1. Fetch job details
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (jobError || !job) throw new Error('Job niet gevonden');
  if (job.status === 'completed') return; // Idempotent

  // 2. Mark as processing
  await supabase
    .from('jobs')
    .update({ status: 'processing', started_at: new Date().toISOString(), error: null })
    .eq('id', jobId);

  try {
    // 3. Build and execute query
    const filters = (job.filters ?? {}) as Record<string, unknown>;
    const columns = (filters.columns ?? []) as Array<{ key: string; label: string }>;
    const entity = job.entity as string;
    const selectQuery = job.select_query || '*';

    const ALLOWED_ENTITIES = ['accounts', 'contacts', 'deals', 'consultants', 'activities', 'communications'];
    if (!ALLOWED_ENTITIES.includes(entity)) {
      throw new Error(`Invalid export entity: ${entity}`);
    }

    // deno-lint-ignore no-explicit-any
    let query: any = supabase.from(entity).select(selectQuery);

    const orFilter = filters.orFilter as string | undefined;
    const eqFilters = filters.eqFilters as Record<string, string> | undefined;
    const sort = filters.sort as { column: string; direction: string } | undefined;

    if (orFilter) query = query.or(orFilter);
    if (eqFilters) {
      for (const [key, value] of Object.entries(eqFilters)) {
        if (value !== undefined && value !== '') {
          query = query.eq(key, value);
        }
      }
    }
    if (sort) {
      query = query.order(sort.column, { ascending: sort.direction === 'asc' });
    }

    const { data: rows, error: queryError } = await query;
    if (queryError) throw new Error(`Query fout: ${queryError.message}`);

    const totalRows = rows?.length ?? 0;

    if (totalRows === 0) {
      await supabase
        .from('jobs')
        .update({
          status: 'completed',
          progress: 100,
          row_count: 0,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);
      await sendNotification(supabase, job.requested_by, entity, 0);
      return;
    }

    // 4. Build export rows
    const exportRows: Record<string, unknown>[] = [];
    let processedRows = 0;

    for (const row of rows!) {
      const exportRow: Record<string, unknown> = {};
      for (const col of columns) {
        exportRow[col.label] = extractValue(row, col.key);
      }
      exportRows.push(exportRow);
      processedRows++;

      if (processedRows % PROGRESS_BATCH === 0) {
        const progress = Math.round((processedRows / totalRows) * 80);
        await supabase.from('jobs').update({ progress }).eq('id', jobId);
      }
    }

    await supabase.from('jobs').update({ progress: 85 }).eq('id', jobId);

    // 5. Generate file
    let fileBuffer: Uint8Array;
    let contentType: string;
    const format = job.format as string;

    if (format === 'csv') {
      const csv = generateCsv(exportRows, columns);
      fileBuffer = new TextEncoder().encode(csv);
      contentType = 'text/csv';
    } else {
      const { default: ExcelJS } = await import('https://esm.sh/exceljs@4.4.0');
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Export');

      const headers = columns.map((c) => c.label);
      sheet.addRow(headers);

      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE8E8E8' },
      };

      for (const row of exportRows) {
        const values = columns.map((c) => {
          const val = row[c.label];
          if (val === null || val === undefined) return '';
          if (typeof val === 'boolean') return val ? 'Ja' : 'Nee';
          return val;
        });
        sheet.addRow(values);
      }

      for (const column of sheet.columns) {
        let maxLength = 10;
        column.eachCell?.({ includeEmpty: false }, (cell: { value?: { toString(): string } }) => {
          const cellLength = cell.value?.toString().length ?? 0;
          maxLength = Math.max(maxLength, cellLength);
        });
        column.width = Math.min(maxLength + 2, 50);
      }

      const buffer = await workbook.xlsx.writeBuffer();
      fileBuffer = new Uint8Array(buffer);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    await supabase.from('jobs').update({ progress: 95 }).eq('id', jobId);

    // 6. Upload to storage
    const filePath = `exports/${jobId}/export.${format}`;
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, fileBuffer, { contentType, upsert: true });

    if (uploadError) throw new Error(`Upload fout: ${uploadError.message}`);

    // 7. Update job as completed
    await supabase
      .from('jobs')
      .update({
        status: 'completed',
        progress: 100,
        row_count: totalRows,
        file_path: filePath,
        file_size: fileBuffer.length,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    // 8. Send notification
    await sendNotification(supabase, job.requested_by, entity, totalRows);
  } catch (err) {
    // Mark job as failed so the user can retry
    const errorMessage = err instanceof Error ? err.message : 'Onbekende fout';
    await supabase
      .from('jobs')
      .update({ status: 'failed', error: errorMessage })
      .eq('id', jobId);
    throw err; // Re-throw so the HTTP response reflects the error
  }
}

function extractValue(row: Record<string, unknown>, key: string): unknown {
  const parts = key.split('.');
  let value: unknown = row;
  for (const part of parts) {
    if (value === null || value === undefined) return null;
    value = (value as Record<string, unknown>)[part];
  }
  return value;
}

function generateCsv(
  rows: Record<string, unknown>[],
  columns: Array<{ key: string; label: string }>,
): string {
  const headers = columns.map((c) => escapeCsvField(c.label));
  const lines = [headers.join(',')];

  for (const row of rows) {
    const values = columns.map((c) => {
      const val = row[c.label];
      if (val === null || val === undefined) return '';
      if (typeof val === 'boolean') return val ? 'Ja' : 'Nee';
      return escapeCsvField(String(val));
    });
    lines.push(values.join(','));
  }

  return '\uFEFF' + lines.join('\n');
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

async function sendNotification(
  supabase: SupabaseClient,
  userId: string,
  entity: string,
  rowCount: number,
) {
  const entityLabel = entity.charAt(0).toUpperCase() + entity.slice(1);
  await supabase.from('notifications').insert({
    user_id: userId,
    title: `Export ${entityLabel} gereed`,
    message: rowCount > 0
      ? `${rowCount.toLocaleString('nl-BE')} rijen geëxporteerd.`
      : 'Export voltooid — geen rijen gevonden.',
    metadata: { link: '/admin/jobs' },
  });
}
