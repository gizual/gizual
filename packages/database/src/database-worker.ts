import "@giz/logging/worker";

import {
  type Database as SqliteDb,
  default as sqlite3InitModule,
  type Sqlite3Static,
} from "@sqlite.org/sqlite-wasm";
import { expose } from "comlink";
import dedent from "dedent";
import _flatten from "lodash/flatten";

import { Author } from "@giz/explorer";
import { PoolPortal } from "@giz/explorer-web";
import { createLogger } from "@giz/logging";

const logger = createLogger();

const AUTHORS_TABLE = dedent`
  CREATE TABLE authors (
      id VARCHAR(20) PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      gravatarHash TEXT NOT NULL,
      numCommits INTEGER DEFAULT 0,
      UNIQUE(name, email)
  );
`;

const INSERT_AUTHORS_TABLE = dedent`
  INSERT INTO authors (id, name, email, gravatarHash, numCommits) VALUES (?, ?, ?, ?, ?);
`;

const COMMITS_TABLE = dedent`
  CREATE TABLE commits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      oid VARCHAR(40), 
      aid VARCHAR(20) NOT NULL, 
      message TEXT NOT NULL,
      timestamp INTEGER NOT NULL
  );
`;

const INSERT_COMMIT_STMT = dedent`
  INSERT INTO commits (oid, aid, message, timestamp) VALUES (?, ?, ?, ?);
`;

const FILES_TABLE = dedent`
  CREATE TABLE files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filePath TEXT NOT NULL,
      UNIQUE(filePath)
  );
`;

const INSERT_FILE_STMT = dedent`
  INSERT OR IGNORE INTO files (filePath) VALUES (?);
`;

const SELECT_FILE_STMT = dedent`
  SELECT id FROM files WHERE filePath = (?);
`;

const COMMITS_FILES_TABLE = dedent`
  CREATE TABLE commits_files (id INTEGER PRIMARY KEY AUTOINCREMENT, cid INTEGER, fid INTEGER);
`;

const INSERT_COMMITS_FILES_STMT = dedent`
  INSERT INTO commits_files (cid, fid) VALUES (?, ?);
`;

export type QueryAuthorsOpts = {
  offset?: number;
  limit?: number;
  orderBy?: ["numCommits" | "name", "ASC" | "DESC"];
  search?: string;
};

export class DatabaseWorker {
  db!: SqliteDb;
  portal!: PoolPortal;
  constructor() {
    logger.log("DatabaseWorker constructor");
  }
  async init(port: MessagePort) {
    this.portal = new PoolPortal(port);
    logger.log("Loading and initializing SQLite3 module...");
    return sqlite3InitModule({
      print: (m) => logger.log(m),
      printErr: (e) => logger.error(e),
    }).then((sqlite3) => {
      try {
        logger.log("Done initializing. Running demo...");
        return this.run(sqlite3);
      } catch (error_: any) {
        logger.error(error_.name, error_.message);
      }
    });
  }

  initDb(sqlite3: Sqlite3Static) {
    const db = new sqlite3.oo1.DB();

    logger.log("Creating authors table ...");
    db.exec(AUTHORS_TABLE);

    return db;
    logger.log("Creating commits table ...");

    db.exec(COMMITS_TABLE);
    logger.log("Creating files table ...");

    db.exec(FILES_TABLE);
    logger.log("Creating commits_files table ...");

    db.exec(COMMITS_FILES_TABLE);

    return db;
  }

  async queryAuthors(opts: QueryAuthorsOpts): Promise<Author[]> {
    const { offset = 0, limit = 10, orderBy = ["numCommits", "DESC"], search } = opts;

    if (!search) {
      const result = await this.db.exec({
        sql: dedent`
          SELECT id, name, email, gravatarHash, numCommits 
          FROM authors 
          ORDER BY ${orderBy[0]} ${orderBy[1]} 
          LIMIT ${limit}
          OFFSET ${offset};
        `,
        returnValue: "resultRows",
        rowMode: "object",
      });

      return result as any;
    }

    const result = await this.db.exec({
      sql: dedent`
        SELECT id, name, email, gravatarHash, numCommits
        FROM authors
        WHERE name LIKE (?) OR email LIKE (?)
        ORDER BY  ${orderBy[0]} ${orderBy[1]}
        LIMIT ${limit}
        OFFSET ${offset};
      `,
      returnValue: "resultRows",
      rowMode: "object",
      bind: [`%${search}%`, `%${search}%`],
    });

    return result as any;
  }

  async countAuthors(): Promise<number> {
    const result = await this.db.exec({
      sql: "SELECT COUNT(*) FROM authors;",
      returnValue: "resultRows",
      rowMode: 0,
    });

    return result[0] as number;
  }

  async loadAuthors() {
    const stmt = this.db.prepare(INSERT_AUTHORS_TABLE);

    const authors = await this.portal.getAuthors();

    logger.log("adding", authors.length, "authors to database");

    for (const author of authors) {
      stmt
        .bind([author.id, author.name, author.email, author.gravatarHash, author.numCommits])
        .step();
      stmt.reset();
    }

    stmt.finalize();
  }

  async loadCommits() {
    let counter = 0;
    const commitStmt = this.db.prepare(INSERT_COMMIT_STMT.trim());
    const fileStmt = this.db.prepare(INSERT_FILE_STMT.trim());

    await new Promise<void>((resolve, reject) => {
      this.portal.streamCommits(
        (commit) => {
          counter++;

          if (counter % 100 === 0) {
            logger.log("counter", counter);
          }
          const files = commit.files;

          const fileIds: number[] = [];

          for (const file of files) {
            fileStmt.bind([file]).step();
            fileStmt.reset();

            let fileId = -1;

            this.db.exec({
              sql: SELECT_FILE_STMT,
              rowMode: "object",
              bind: [file],
              callback: function (this: any, row: any) {
                fileId = row.id;
              },
            });

            if (fileId === -1) {
              logger.warn("fileId is -1");
              continue;
            }
            fileIds.push(fileId);
          }

          commitStmt
            .bind([commit.oid, commit.aid, commit.message, Number.parseInt(commit.timestamp)])
            .step();
          commitStmt.reset();

          let commitId = -1;

          this.db.exec({
            sql: `SELECT id FROM commits WHERE oid = (?)`,
            rowMode: "object",
            bind: [commit.oid],
            callback: function (this: any, row: any) {
              commitId = row.id;
            },
          });

          if (commitId === -1) {
            logger.warn("fileId is -1");
            return;
          }

          for (const fileId of fileIds) {
            this.db.exec({
              sql: INSERT_COMMITS_FILES_STMT,
              bind: [commitId, fileId],
            });
          }
        },
        () => {
          resolve();
        },
        (error) => {
          reject(error);
        },
      );
    });

    commitStmt.finalize();
    fileStmt.finalize();

    return counter;
  }

  async run(sqlite3: Sqlite3Static) {
    this.db = this.initDb(sqlite3);

    logger.log("Loading authors ...");
    await this.loadAuthors();
    //logger.log("Loading commits ...");
    //const count = await this.loadCommits();
    //logger.log(`Database ready! Indexed ${count} commits.`);
    logger.log(`Database ready!`);

    return;

    this.db.exec("CREATE TABLE branches (id INTEGER PRIMARY KEY, name TEXT);");

    const branches = await this.portal.getBranches();
    const stmtStr = "INSERT INTO branches (name) VALUES (?)";
    const stmt = this.db.prepare(stmtStr);

    logger.log("Adding branches using", stmtStr);
    try {
      for (const branch of branches) {
        stmt.bind([branch]).step();
        stmt.reset();
      }
    } finally {
      stmt.finalize();
    }

    logger.log("Query data with exec('SELECT id, name FROM branches')");
    this.db.exec({
      sql: "SELECT id, name FROM branches",
      rowMode: "object",
      callback: function (this: any, row: any) {
        logger.log("row", this.counter++, " = ", JSON.stringify(row));
      }.bind({ counter: 0 }),
    });
  }

  async selectMatchingFiles(query: Query, branch: string): Promise<string[]> {
    const availableFiles = await new Promise<string[]>((resolve, reject) => {
      const files: string[] = [];

      this.portal.streamFileTree(
        branch,
        (file) => {
          if (!Number.isNaN(file.kind)) {
            files.push(file.path.join("/"));
          }
        },
        () => {
          resolve(files);
        },
        (error) => {
          reject(error);
        },
      );
    });

    const stmt = `SELECT filePath FROM files WHERE filePath LIKE (?) AND id IN (SELECT fid FROM commits_files WHERE cid IN (SELECT id FROM commits WHERE aid IN (SELECT id FROM authors WHERE email LIKE (?))))`;
    logger.log("using SQL:", stmt);

    const result = this.db.exec({
      sql: stmt,
      returnValue: "resultRows",
      rowMode: 0,
      bind: [query.path.replace("*", "%"), query.editedBy],
    });

    const possibleFiles = _flatten(result).map((row) => `${row}`);

    return possibleFiles.filter((file) => availableFiles.includes(file));
  }
}

if (typeof self !== "undefined" && typeof window === "undefined") {
  // only expose in a worker
  expose(new DatabaseWorker());
}

export type Query = {
  path: string;
  editedBy: string;
};
