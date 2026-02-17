import express from 'express';
import cors from 'cors';
import path from 'path';
import pg from 'pg';

const { Client } = pg;
const app = express();
const PORT = 4003;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/view', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});
app.use('/view', express.static(path.join(process.cwd(), 'published')));
app.use('/preview-assets', express.static(path.join(process.cwd(), 'dist-preview')));

// --- DATA SOURCE API ---

app.post('/api/datasources/databases', async (req, res) => {
  const { config } = req.body;

  if (!config) {
    res.status(400).json({ success: false, message: 'No config provided' });
    return;
  }

  // Connect to 'postgres' database to list all other databases
  const client = new Client({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: 'postgres', // Always use postgres system db to list others
    ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();
    const result = await client.query("SELECT datname FROM pg_database WHERE datistemplate = false AND datallowconn = true ORDER BY datname");
    await client.end();

    const databases = result.rows.map(r => r.datname);
    res.json({ success: true, databases });
  } catch (error: any) {
    console.error('List Databases Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/datasources/test', async (req, res) => {
  const { config } = req.body;

  if (!config) {
    res.status(400).json({ success: false, message: 'No config provided' });
    return;
  }

  const client = new Client({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database,
    ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();
    await client.query('SELECT NOW()');
    await client.end();
    res.json({ success: true, message: 'Connection successful' });
  } catch (error: any) {
    console.error('DB Connection Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/datasources/schema', async (req, res) => {
  const { config } = req.body;

  // Basic validation
  if (!config || !config.host || !config.username) {
    res.status(400).json({ error: 'Invalid configuration' });
    return;
  }

  const client = new Client({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database,
    ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();

    // Fetch Tables and Columns (PostgreSQL specific for now)
    const columnsQuery = `
      SELECT 
        c.table_schema, 
        c.table_name, 
        c.column_name, 
        c.data_type,
        c.udt_name
      FROM information_schema.columns c
      WHERE c.table_schema NOT IN ('information_schema', 'pg_catalog')
      ORDER BY c.table_schema, c.table_name, c.ordinal_position;
    `;
    const fksQuery = `
        SELECT
            tc.table_schema, 
            tc.table_name, 
            kcu.column_name, 
            ccu.table_schema AS foreign_table_schema,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema NOT IN ('information_schema', 'pg_catalog');
    `;

    const enumsQuery = `
      SELECT t.typname, e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname NOT IN('information_schema', 'pg_catalog');
    `;

    const [columnsResult, fksResult, enumsResult] = await Promise.all([
      client.query(columnsQuery),
      client.query(fksQuery),
      client.query(enumsQuery)
    ]);

    await client.end();

    const tables: any[] = [];
    const tableMap = new Map<string, any>();
    const enumMap = new Map<string, string[]>();

    // Process Enums First
    enumsResult.rows.forEach((row: any) => {
      if (!enumMap.has(row.typname)) {
        enumMap.set(row.typname, []);
      }
      enumMap.get(row.typname)?.push(row.enumlabel);
    });

    // Process Columns
    columnsResult.rows.forEach((row: any) => {
      const fullTableName = `${row.table_schema}.${row.table_name}`;

      if (!tableMap.has(fullTableName)) {
        const table = {
          id: row.table_name,
          name: row.table_name,
          schema: row.table_schema,
          fields: [],
          triggers: []
        };
        tableMap.set(fullTableName, table);
        tables.push(table);
      }

      const table = tableMap.get(fullTableName);

      let type = 'string';
      let options: string[] | undefined;
      const dt = row.data_type.toLowerCase();
      const udt = row.udt_name; // User Defined Type name (often holds the enum name)

      if (['integer', 'bigint', 'decimal', 'numeric', 'real', 'double precision', 'smallint'].includes(dt)) type = 'number';
      else if (['boolean'].includes(dt)) type = 'boolean';
      else if (['date', 'timestamp without time zone', 'timestamp with time zone', 'timestamp'].includes(dt)) type = 'date';
      else if (row.data_type === 'USER-DEFINED' && enumMap.has(udt)) {
        type = 'enum';
        options = enumMap.get(udt);
      }

      table.fields.push({
        name: row.column_name,
        type: type,
        label: row.column_name,
        isSelected: true,
        options: options,
        foreignKey: null // Initialize
      });
    });

    // Process FKs
    fksResult.rows.forEach((row: any) => {
      const fullTableName = `${row.table_schema}.${row.table_name}`;
      const table = tableMap.get(fullTableName);
      if (table) {
        const field = table.fields.find((f: any) => f.name === row.column_name);
        if (field) {
          field.foreignKey = {
            schema: row.foreign_table_schema,
            table: row.foreign_table_name,
            column: row.foreign_column_name
          };
        }
      }
    });

    res.json({ success: true, tables });

  } catch (error: any) {
    console.error('Schema Fetch Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/datasources/query', async (req, res) => {
  const { config, table, tableName, limit = 100, filters } = req.body;

  if (!config || (!table && !tableName)) {
    res.status(400).json({ error: 'Config and table/tableName are required' });
    return;
  }

  const client = createClient(config);

  try {
    await client.connect();
    const { schemaName, targetTable } = getTableInfo(table, tableName);

    let query = `SELECT * FROM "${schemaName}"."${targetTable}"`;
    const values: any[] = [];

    // filters: [{ field, operator, value }]
    if (filters && Array.isArray(filters) && filters.length > 0) {
      const clauses: string[] = [];
      let i = 1;
      filters.forEach((f) => {
        if (f.field && f.operator && f.value !== undefined) {
          // Basic validation to prevent obvious injection in field names
          // In a real app, validate against schema fields
          const field = f.field.replace(/[^a-zA-Z0-9_]/g, '');
          clauses.push(`"${field}" ${f.operator} $${i}`);
          values.push(f.value);
          i++;
        }
      });
      if (clauses.length > 0) {
        query += ` WHERE ${clauses.join(' AND ')}`;
      }
    }

    query += ` LIMIT ${limit}`; // Append limit at the end

    const result = await client.query(query, values);
    await client.end();

    res.json({ success: true, rows: result.rows });
  } catch (error: any) {
    console.error('Query Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- CRUD OPERATIONS ---

const getTableInfo = (table: any, tableName: string) => {
  let schemaName = 'public';
  let targetTable = '';

  if (table && typeof table === 'object') {
    schemaName = table.schema || 'public';
    targetTable = table.name;
  } else {
    // Handle string tableName (e.g. "public.users" or just "users")
    const parts = (tableName || table).split('.');
    if (parts.length > 1) {
      schemaName = parts[0];
      targetTable = parts[1];
    } else {
      targetTable = parts[0];
    }
  }
  return { schemaName, targetTable };
};

const createClient = (config: any) => {
  return new Client({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database,
    ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
  });
};

app.post('/api/datasources/insert', async (req, res) => {
  const { config, table, tableName, data } = req.body;

  if (!config || (!table && !tableName) || !data) {
    res.status(400).json({ error: 'Config, table/tableName, and data are required' });
    return;
  }

  const client = createClient(config);

  try {
    await client.connect();
    const { schemaName, targetTable } = getTableInfo(table, tableName);

    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.map(k => `"${k}"`).join(', ');

    const query = `INSERT INTO "${schemaName}"."${targetTable}" (${columns}) VALUES (${placeholders}) RETURNING *`;
    const result = await client.query(query, values);

    await client.end();
    res.json({ success: true, row: result.rows[0] });
  } catch (error: any) {
    console.error('Insert Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/datasources/update', async (req, res) => {
  const { config, table, tableName, id, data } = req.body;

  if (!config || (!table && !tableName) || !id || !data) {
    res.status(400).json({ error: 'Config, table/tableName, id, and data are required' });
    return;
  }

  const client = createClient(config);

  try {
    await client.connect();
    const { schemaName, targetTable } = getTableInfo(table, tableName);

    const updates: string[] = [];
    const values: any[] = [];
    let i = 1;

    Object.entries(data).forEach(([key, value]) => {
      updates.push(`"${key}" = $${i}`);
      values.push(value);
      i++;
    });

    // Assume generic 'id' column for simplicity, or we could pass the PK name
    values.push(id);
    const query = `UPDATE "${schemaName}"."${targetTable}" SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`;

    const result = await client.query(query, values);
    await client.end();

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Record not found' });
    } else {
      res.json({ success: true, row: result.rows[0] });
    }
  } catch (error: any) {
    console.error('Update Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/datasources/delete', async (req, res) => {
  const { config, table, tableName, id } = req.body;

  if (!config || (!table && !tableName) || !id) {
    res.status(400).json({ error: 'Config, table/tableName, and id are required' });
    return;
  }

  const client = createClient(config);

  try {
    await client.connect();
    const { schemaName, targetTable } = getTableInfo(table, tableName);

    // Assume generic 'id' column
    const query = `DELETE FROM "${schemaName}"."${targetTable}" WHERE id = $1 RETURNING id`;
    const result = await client.query(query, [id]);

    await client.end();

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Record not found' });
    } else {
      res.json({ success: true, id });
    }
  } catch (error: any) {
    console.error('Delete Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/publish', async (req, res) => {
  const { astroCode, htmlCode, json, sources, name = 'index' } = req.body;

  if (!astroCode || !htmlCode || !json) {
    res.status(400).json({ success: false, message: 'Missing data' });
    return;
  }

  // Basic sanitization for the name
  const safeName = name.replace(/[^a-z0-9-]/gi, '_').toLowerCase();

  try {
    const fs = await import('fs/promises');
    const path = await import('path');

    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'published');
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir);
    }

    const astroFilename = safeName.endsWith('.astro') ? safeName : `${safeName}.astro`;
    const htmlFilename = safeName.endsWith('.html') ? safeName : `${safeName}.html`;
    const jsonFilename = safeName.endsWith('.json') ? safeName : `${safeName}.json`;
    const sourcesFilename = safeName.endsWith('.sources.json') ? safeName : `${safeName}.sources.json`;

    const astroPath = path.join(dataDir, astroFilename);
    const htmlPath = path.join(dataDir, htmlFilename);
    const jsonPath = path.join(dataDir, jsonFilename);
    const sourcesPath = path.join(dataDir, sourcesFilename);

    await fs.writeFile(astroPath, astroCode);
    await fs.writeFile(htmlPath, htmlCode);
    await fs.writeFile(jsonPath, json);
    if (sources) {
      await fs.writeFile(sourcesPath, JSON.stringify(sources, null, 2));
    }

    // Append timestamp to force refresh
    const url = `http://localhost:${PORT}/view/${htmlFilename}?t=${Date.now()}`;
    console.log(`[Publish] Layout published. Astro: ${astroPath}, HTML: ${htmlPath}, JSON: ${jsonPath}. URL: ${url}`);
    res.json({ success: true, message: 'Published successfully', astroPath, htmlPath, jsonPath, url });
  } catch (error: any) {
    console.error('Publish Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`BFF(Backend for Frontend) running on http://localhost:${PORT}`);
});
