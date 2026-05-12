/**
 * 极简内存 DB：仅在 Web 预览时使用。
 * 模拟 expo-sqlite 的部分 API（execAsync / runAsync / getAllAsync），
 * 支持本项目用到的 SQL 子集：CREATE/DROP TABLE、INSERT、UPDATE、DELETE、SELECT。
 */

type Row = Record<string, any>;
type Table = {
  cols: { name: string; pk?: boolean; auto?: boolean }[];
  rows: Row[];
  autoId: number;
};

export class MemoryDB {
  private tables = new Map<string, Table>();

  async execAsync(sql: string): Promise<void> {
    for (const stmt of splitSql(sql)) this.execOne(stmt);
  }

  async runAsync(sql: string, params: any[] = []): Promise<{ lastInsertRowId: number; changes: number }> {
    return this.execOne(sql, params);
  }

  async getAllAsync<T = Row>(sql: string, params: any[] = []): Promise<T[]> {
    return this.execOne(sql, params).rows as T[];
  }

  // ---- internal ----
  private execOne(sqlRaw: string, params: any[] = []): { lastInsertRowId: number; changes: number; rows: Row[] } {
    const sql = sqlRaw.trim().replace(/;\s*$/, '');
    if (!sql) return empty();

    const head = sql.split(/\s+/, 2).join(' ').toUpperCase();

    if (head.startsWith('PRAGMA') || head.startsWith('CREATE INDEX') || head.startsWith('DROP INDEX')) {
      return empty();
    }

    if (head.startsWith('CREATE TABLE')) {
      const m = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([\s\S]+)\)/i);
      if (!m) return empty();
      const [, name, body] = m;
      if (this.tables.has(name)) return empty();
      const cols = body
        .split(/,(?![^(]*\))/)
        .map((s) => s.trim())
        .filter((s) => s && !/^PRIMARY KEY/i.test(s))
        .map((s) => {
          const parts = s.split(/\s+/);
          const colName = parts[0].replace(/"/g, '');
          const upper = s.toUpperCase();
          return {
            name: colName,
            pk: upper.includes('PRIMARY KEY'),
            auto: upper.includes('AUTOINCREMENT'),
          };
        });
      this.tables.set(name, { cols, rows: [], autoId: 0 });
      return empty();
    }

    if (head.startsWith('DROP TABLE')) {
      const m = sql.match(/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(\w+)/i);
      if (m) this.tables.delete(m[1]);
      return empty();
    }

    if (head.startsWith('INSERT')) {
      const m = sql.match(/INSERT(?:\s+OR\s+REPLACE)?\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
      if (!m) return empty();
      const isReplace = /INSERT\s+OR\s+REPLACE/i.test(sql);
      const [, name, colsList] = m;
      const t = this.tables.get(name);
      if (!t) throw new Error(`no table ${name}`);
      const cols = colsList.split(',').map((s) => s.trim());
      const row: Row = {};
      cols.forEach((c, i) => (row[c] = params[i]));
      const pkCol = t.cols.find((c) => c.pk);
      let lastId = 0;
      if (pkCol?.auto && !(pkCol.name in row)) {
        t.autoId += 1;
        row[pkCol.name] = t.autoId;
        lastId = t.autoId;
      }
      // fill defaults
      t.cols.forEach((c) => {
        if (!(c.name in row)) row[c.name] = null;
      });
      if (isReplace && pkCol) {
        const idx = t.rows.findIndex((r) => r[pkCol.name] === row[pkCol.name]);
        if (idx >= 0) {
          t.rows[idx] = row;
          return { lastInsertRowId: lastId, changes: 1, rows: [] };
        }
      }
      t.rows.push(row);
      return { lastInsertRowId: lastId, changes: 1, rows: [] };
    }

    if (head.startsWith('UPDATE')) {
      const m = sql.match(/UPDATE\s+(\w+)\s+SET\s+([\s\S]+?)(?:\s+WHERE\s+([\s\S]+))?$/i);
      if (!m) return empty();
      const [, name, setExpr, whereExpr] = m;
      const t = this.tables.get(name);
      if (!t) return empty();
      const sets = setExpr.split(',').map((s) => s.trim());
      const setPlan = sets.map((s) => {
        const [c] = s.split('=').map((x) => x.trim());
        return c.replace(/"/g, '');
      });
      let p = 0;
      const setVals: Record<string, any> = {};
      setPlan.forEach((c) => (setVals[c] = params[p++]));
      const whereFn = whereExpr ? compileWhere(whereExpr, params, p) : () => true;
      let changes = 0;
      t.rows.forEach((row) => {
        if (whereFn(row)) {
          Object.assign(row, setVals);
          changes++;
        }
      });
      return { lastInsertRowId: 0, changes, rows: [] };
    }

    if (head.startsWith('DELETE')) {
      const m = sql.match(/DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+([\s\S]+))?$/i);
      if (!m) return empty();
      const [, name, whereExpr] = m;
      const t = this.tables.get(name);
      if (!t) return empty();
      const whereFn = whereExpr ? compileWhere(whereExpr, params, 0) : () => true;
      const before = t.rows.length;
      t.rows = t.rows.filter((r) => !whereFn(r));
      return { lastInsertRowId: 0, changes: before - t.rows.length, rows: [] };
    }

    if (head.startsWith('SELECT')) {
      // SELECT [DISTINCT] cols FROM table [WHERE ...] [GROUP BY ...] [ORDER BY ...] [LIMIT n]
      const m = sql.match(
        /SELECT\s+(DISTINCT\s+)?([\s\S]+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+([\s\S]+?))?(?:\s+GROUP\s+BY\s+([\s\S]+?))?(?:\s+ORDER\s+BY\s+([\s\S]+?))?(?:\s+LIMIT\s+(\?|\d+))?$/i,
      );
      if (!m) return empty();
      const [, distinct, colsExpr, name, whereExpr, groupExpr, orderExpr, limitExpr] = m;
      const t = this.tables.get(name);
      if (!t) return { lastInsertRowId: 0, changes: 0, rows: [] };
      let p = 0;
      const whereFn = whereExpr ? compileWhere(whereExpr, params, p) : () => true;
      if (whereExpr) p += countQ(whereExpr);
      let rows = t.rows.filter(whereFn);

      // GROUP BY (用于 SUM/COUNT)
      let projectCols: { src: string; alias: string; agg?: 'SUM' | 'COUNT' }[] = [];
      const colsTrim = colsExpr.trim();
      if (colsTrim === '*') {
        projectCols = t.cols.map((c) => ({ src: c.name, alias: c.name }));
      } else {
        projectCols = colsTrim.split(',').map((part) => {
          const s = part.trim();
          const ag = s.match(/^(SUM|COUNT)\(([\w*]+)\)\s*(?:as\s+(\w+))?$/i);
          if (ag) {
            return { src: ag[2], alias: ag[3] ?? `${ag[1].toLowerCase()}`, agg: ag[1].toUpperCase() as 'SUM' | 'COUNT' };
          }
          const al = s.match(/^(\w+)\s+as\s+(\w+)$/i);
          if (al) return { src: al[1], alias: al[2] };
          return { src: s, alias: s };
        });
      }

      let resultRows: Row[];
      if (groupExpr) {
        const groupCols = groupExpr.split(',').map((s) => s.trim());
        const groups = new Map<string, Row[]>();
        rows.forEach((r) => {
          const k = groupCols.map((g) => r[g]).join('||');
          if (!groups.has(k)) groups.set(k, []);
          groups.get(k)!.push(r);
        });
        resultRows = Array.from(groups.values()).map((grp) => {
          const out: Row = {};
          projectCols.forEach((c) => {
            if (c.agg === 'SUM') out[c.alias] = grp.reduce((a, r) => a + (Number(r[c.src]) || 0), 0);
            else if (c.agg === 'COUNT') out[c.alias] = grp.length;
            else out[c.alias] = grp[0][c.src];
          });
          return out;
        });
      } else if (projectCols.some((c) => c.agg)) {
        const out: Row = {};
        projectCols.forEach((c) => {
          if (c.agg === 'SUM') out[c.alias] = rows.reduce((a, r) => a + (Number(r[c.src]) || 0), 0);
          else if (c.agg === 'COUNT') out[c.alias] = rows.length;
          else out[c.alias] = rows[0]?.[c.src] ?? null;
        });
        resultRows = [out];
      } else {
        resultRows = rows.map((r) => {
          const out: Row = {};
          projectCols.forEach((c) => (out[c.alias] = r[c.src]));
          return out;
        });
      }

      if (distinct) {
        const seen = new Set<string>();
        resultRows = resultRows.filter((r) => {
          const k = JSON.stringify(r);
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
      }

      if (orderExpr) {
        const orders = orderExpr.split(',').map((s) => {
          const parts = s.trim().split(/\s+/);
          return { col: parts[0], desc: (parts[1] || '').toUpperCase() === 'DESC' };
        });
        resultRows.sort((a, b) => {
          for (const o of orders) {
            const av = a[o.col];
            const bv = b[o.col];
            if (av === bv) continue;
            const cmp = av > bv ? 1 : -1;
            return o.desc ? -cmp : cmp;
          }
          return 0;
        });
      }

      if (limitExpr) {
        const n = limitExpr === '?' ? Number(params[p++]) : Number(limitExpr);
        resultRows = resultRows.slice(0, n);
      }

      return { lastInsertRowId: 0, changes: 0, rows: resultRows };
    }

    return empty();
  }
}

export function createMemoryDB() {
  return new MemoryDB();
}

function empty() {
  return { lastInsertRowId: 0, changes: 0, rows: [] };
}

function splitSql(sql: string): string[] {
  return sql
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

function countQ(s: string): number {
  return (s.match(/\?/g) || []).length;
}

/**
 * 极简 WHERE 编译：支持 col = ?、col >= ? 这种最简单的等值/比较，多个用 AND 连接
 */
function compileWhere(expr: string, params: any[], startP: number): (row: Row) => boolean {
  const parts = expr.split(/\s+AND\s+/i).map((p) => p.trim());
  let p = startP;
  const checks: ((row: Row) => boolean)[] = [];
  for (const part of parts) {
    const m = part.match(/^(\w+)\s*(=|>=|<=|>|<|!=)\s*\?$/);
    if (!m) {
      // 不支持的子句一律返回 true，避免炸
      continue;
    }
    const [, col, op] = m;
    const v = params[p++];
    checks.push((r: Row) => {
      const rv = r[col];
      switch (op) {
        case '=': return rv == v;
        case '!=': return rv != v;
        case '>': return rv > v;
        case '<': return rv < v;
        case '>=': return rv >= v;
        case '<=': return rv <= v;
      }
      return true;
    });
  }
  return (r) => checks.every((f) => f(r));
}
