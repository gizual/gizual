/* eslint-disable unicorn/no-null */
import { GizDate } from "@giz/utils/gizdate";

//const mockAuthors: Author[] = [
//  { id: "1", name: "Mock Author 1", email: "mock@author.com", gravatarHash: "" },
//  { id: "2", name: "Mock Author 2", email: "mock-author-2@long-domain.com", gravatarHash: "" },
//  { id: "3", name: "Mock Author 3", email: "mock-author-3@long-domain.com", gravatarHash: "" },
//];
//
//const mockContent: Line[] = [
//  {
//    content: "{",
//    commit: {
//      authorId: mockAuthors[0].id,
//      timestamp: "1698953122633",
//      message: "Mock commit 1",
//      aid: mockAuthors[0].id,
//      oid: "1",
//      children: [],
//      parents: [null, null],
//      is_merge: false,
//    },
//  },
//  {
//    content: "  Mock line 2 is short",
//    commit: {
//      authorId: mockAuthors[1].id,
//      timestamp: "1698653112633",
//      message: "Mock commit 2",
//      aid: mockAuthors[1].id,
//      oid: "2",
//      children: [],
//      parents: [null, null],
//      is_merge: false,
//    },
//  },
//  {
//    content: "  Mock line 3 has a little more content, but not much",
//    commit: {
//      authorId: mockAuthors[0].id,
//      timestamp: "1698353102633",
//      message: "Mock commit 3",
//      aid: mockAuthors[2].id,
//      oid: "2",
//      children: [],
//      parents: [null, null],
//      is_merge: false,
//    },
//  },
//  {
//    content: "}",
//    commit: {
//      authorId: mockAuthors[0].id,
//      timestamp: "1698053002633",
//      message: "Mock commit 4",
//      aid: mockAuthors[0].id,
//      oid: "3",
//      children: [],
//      parents: [null, null],
//      is_merge: false,
//    },
//  },
//];
//
//const mockContentHeight = mockContent.length * 10;
//
//export const RendererMockContext: FileContext = {
//  authors: mockAuthors,
//  fileContent: mockContent,
//  coloringMode: "age",
//  dpr: window.devicePixelRatio * 2,
//  earliestTimestamp: Number(mockContent[0].commit?.timestamp),
//  latestTimestamp: Number(mockContent.at(-1)?.commit?.timestamp),
//  isPreview: true,
//  selectedEndDate: new GizDate(),
//  selectedStartDate: new GizDate().subtractDays(365),
//  lineLengthMax: 120,
//  rect: new DOMRect(0, 0, 300, mockContentHeight),
//  redrawCount: 0,
//  visualizationConfig: {
//    colors: {
//      notLoaded: SPECIAL_COLORS.NOT_LOADED,
//      newest: LINEAR_COLOR_RANGE[0],
//      oldest: LINEAR_COLOR_RANGE[1],
//    },
//    style: {
//      lineLength: "lineLength",
//    },
//  },
//};

export const testPackageJSON: any = {
  authors: [
    {
      id: "9dccd01c2476be0d",
      name: "Stefan Schintler",
      email: "stefan@schintler.at",
      gravatarHash: "5060fedadab82ee212b1e9ad5e9b4272",
    },
    {
      id: "1aba3d5527f5c71f",
      name: "Andreas Steinkellner",
      email: "asteinkellner1@gmail.com",
      gravatarHash: "c4367d944c9ca3f6f97c0c02a7213627",
    },
    {
      id: "350c971563bc33f7",
      name: "Stefan Schintler",
      email: "stefan@omnity.at",
      gravatarHash: "189c901ec82b2fbd682c682fb160506e",
    },
    {
      id: "8294d4d6730e87d2",
      name: "Andreas Steinkellner",
      email: "andreas@solasit.at",
      gravatarHash: "4692fb3a4fef8f358eb218a43659b8af",
    },
  ],
  fileContent: [
    {
      content: "{",
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "a9ab27c8b8c237301763446af4139ecb43870288",
        timestamp: "1679415884",
      },
      color: "rgb(88, 28, 135)",
    },
    {
      content: '  "name": "gizual",',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "a9ab27c8b8c237301763446af4139ecb43870288",
        timestamp: "1679415884",
      },
      color: "rgb(88, 28, 135)",
    },
    {
      content: '  "version": "3.0.0",',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "a9ab27c8b8c237301763446af4139ecb43870288",
        timestamp: "1679415884",
      },
      color: "rgb(88, 28, 135)",
    },
    {
      content: '  "packageManager": "yarn@3.5.0",',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "a9ab27c8b8c237301763446af4139ecb43870288",
        timestamp: "1679415884",
      },
      color: "rgb(88, 28, 135)",
    },
    {
      content: '  "license": "Apache-2.0",',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "a9ab27c8b8c237301763446af4139ecb43870288",
        timestamp: "1679415884",
      },
      color: "rgb(88, 28, 135)",
    },
    {
      content: '  "private": true,',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "a9ab27c8b8c237301763446af4139ecb43870288",
        timestamp: "1679415884",
      },
      color: "rgb(88, 28, 135)",
    },
    {
      content: '  "workspaces": [',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "a9ab27c8b8c237301763446af4139ecb43870288",
        timestamp: "1679415884",
      },
      color: "rgb(88, 28, 135)",
    },
    {
      content: '    "./apps/*",',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "680994dcb86697b1f4d38f45234b4353b4aff426",
        timestamp: "1680137319",
      },
      color: "rgb(98, 38, 143)",
    },
    {
      content: '    "./packages/*",',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "680994dcb86697b1f4d38f45234b4353b4aff426",
        timestamp: "1680137319",
      },
      color: "rgb(98, 38, 143)",
    },
    {
      content: '    "./tools/*",',
      commit: {
        authorId: "1aba3d5527f5c71f",
        commitId: "aacd5989b147dd83e2f1caab53510d012c1e9177",
        timestamp: "1689575260",
      },
      color: "rgb(236, 167, 249)",
    },
    {
      content: '    "./apps/gizual-app/src/*"',
      commit: {
        authorId: "1aba3d5527f5c71f",
        commitId: "aacd5989b147dd83e2f1caab53510d012c1e9177",
        timestamp: "1689575260",
      },
      color: "rgb(236, 167, 249)",
    },
    {
      content: "  ],",
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "a9ab27c8b8c237301763446af4139ecb43870288",
        timestamp: "1679415884",
      },
      color: "rgb(88, 28, 135)",
    },
    {
      content: '  "devDependencies": {',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "a9ab27c8b8c237301763446af4139ecb43870288",
        timestamp: "1679415884",
      },
      color: "rgb(88, 28, 135)",
    },
    {
      content: '    "husky": "8.0.3",',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "a9ab27c8b8c237301763446af4139ecb43870288",
        timestamp: "1679415884",
      },
      color: "rgb(88, 28, 135)",
    },
    {
      content: '    "lint-staged": "13.2.3",',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "57873957b7988995aed675473eef9b7b5bd03834",
        timestamp: "1689865053",
      },
      color: "rgb(240, 171, 252)",
    },
    {
      content: '    "prettier": "3.0.0",',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "57873957b7988995aed675473eef9b7b5bd03834",
        timestamp: "1689865053",
      },
      color: "rgb(240, 171, 252)",
    },
    {
      content: '    "prettier-plugin-toml": "0.3.1",',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "e4e7ae24d124cd928659a238af282c40c8f8887c",
        timestamp: "1680171184",
      },
      color: "rgb(99, 38, 143)",
    },
    {
      content: '    "turbo": "1.10.9",',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "57873957b7988995aed675473eef9b7b5bd03834",
        timestamp: "1689865053",
      },
      color: "rgb(240, 171, 252)",
    },
    {
      content: '    "typescript": "5.0.4"',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "57873957b7988995aed675473eef9b7b5bd03834",
        timestamp: "1689865053",
      },
      color: "rgb(240, 171, 252)",
    },
    {
      content: "  },",
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "a9ab27c8b8c237301763446af4139ecb43870288",
        timestamp: "1679415884",
      },
      color: "rgb(88, 28, 135)",
    },
    {
      content: '  "scripts": {',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "a9ab27c8b8c237301763446af4139ecb43870288",
        timestamp: "1679415884",
      },
      color: "rgb(88, 28, 135)",
    },
    {
      content:
        '    "dev": "turbo run dev --parallel --concurrency 20 --scope gizual-app --include-dependencies",',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "353552583b49babe3d552b1cd8bf933c842a0db7",
        timestamp: "1689860932",
      },
      color: "rgb(240, 171, 252)",
    },
    {
      content:
        '    "playground": "yarn turbo run dev --scope @giz/wasi-playground-app  --include-dependencies",',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "792ddb8de2f3411bea4940b5723b9bf6a7d54c9a",
        timestamp: "1685191762",
      },
      color: "rgb(172, 107, 200)",
    },
    {
      content: '    "build": "turbo run build --scope gizual-app --include-dependencies",',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "cff4f6759fcae90f81e990f82075815e483915b9",
        timestamp: "1689611357",
      },
      color: "rgb(236, 168, 249)",
    },
    {
      content: '    "lint": "turbo run lint",',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "680994dcb86697b1f4d38f45234b4353b4aff426",
        timestamp: "1680137319",
      },
      color: "rgb(98, 38, 143)",
    },
    {
      content: '    "format": "yarn prettier:fix && turbo run format",',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "e4e7ae24d124cd928659a238af282c40c8f8887c",
        timestamp: "1680171184",
      },
      color: "rgb(99, 38, 143)",
    },
    {
      content: '    "test": "turbo run test",',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "680994dcb86697b1f4d38f45234b4353b4aff426",
        timestamp: "1680137319",
      },
      color: "rgb(98, 38, 143)",
    },
    {
      content: '    "clean": "turbo run clean",',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "680994dcb86697b1f4d38f45234b4353b4aff426",
        timestamp: "1680137319",
      },
      color: "rgb(98, 38, 143)",
    },
    {
      content: '    "type-check": "turbo run type-check",',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "680994dcb86697b1f4d38f45234b4353b4aff426",
        timestamp: "1680137319",
      },
      color: "rgb(98, 38, 143)",
    },
    {
      content:
        '    "prettier:check": "prettier --check \\"{**/*,*}.{mjs,js,jsx,ts,tsx,md,html,json,yml,yaml,scss,css,toml}\\"",',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "df0399b9c15778b4ef82dda1eac85000cd94241a",
        timestamp: "1680516860",
      },
      color: "rgb(104, 43, 147)",
    },
    {
      content:
        '    "prettier:fix": "prettier --loglevel warn --write \\"{**/*,*}.{mjs,js,jsx,ts,tsx,md,html,json,yml,yaml,scss,css,toml}\\"",',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "df0399b9c15778b4ef82dda1eac85000cd94241a",
        timestamp: "1680516860",
      },
      color: "rgb(104, 43, 147)",
    },
    {
      content: '    "prepare": "husky install"',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "a9ab27c8b8c237301763446af4139ecb43870288",
        timestamp: "1679415884",
      },
      color: "rgb(88, 28, 135)",
    },
    {
      content: "  },",
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "a9ab27c8b8c237301763446af4139ecb43870288",
        timestamp: "1679415884",
      },
      color: "rgb(88, 28, 135)",
    },
    {
      content: '  "lint-staged": {',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "a9ab27c8b8c237301763446af4139ecb43870288",
        timestamp: "1679415884",
      },
      color: "rgb(88, 28, 135)",
    },
    {
      content:
        '    "*.{mjs,js,jsx,ts,tsx,md,css,yaml,yml,json,html,toml}": "prettier --list-different",',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "df0399b9c15778b4ef82dda1eac85000cd94241a",
        timestamp: "1680516860",
      },
      color: "rgb(104, 43, 147)",
    },
    {
      content: '    "*.rs": "cargo fmt --check --"',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "e4e7ae24d124cd928659a238af282c40c8f8887c",
        timestamp: "1680171184",
      },
      color: "rgb(99, 38, 143)",
    },
    {
      content: "  },",
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "680994dcb86697b1f4d38f45234b4353b4aff426",
        timestamp: "1680137319",
      },
      color: "rgb(98, 38, 143)",
    },
    {
      content: '  "engines": {',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "680994dcb86697b1f4d38f45234b4353b4aff426",
        timestamp: "1680137319",
      },
      color: "rgb(98, 38, 143)",
    },
    {
      content: '    "yarn": ">=3.5.0",',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "680994dcb86697b1f4d38f45234b4353b4aff426",
        timestamp: "1680137319",
      },
      color: "rgb(98, 38, 143)",
    },
    {
      content: '    "node": ">=16.0.0"',
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "680994dcb86697b1f4d38f45234b4353b4aff426",
        timestamp: "1680137319",
      },
      color: "rgb(98, 38, 143)",
    },
    {
      content: "  }",
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "a9ab27c8b8c237301763446af4139ecb43870288",
        timestamp: "1679415884",
      },
      color: "rgb(88, 28, 135)",
    },
    {
      content: "}",
      commit: {
        authorId: "9dccd01c2476be0d",
        commitId: "a9ab27c8b8c237301763446af4139ecb43870288",
        timestamp: "1679415884",
      },
      color: "rgb(88, 28, 135)",
    },
  ],
  earliestTimestamp: 1_679_415_884,
  latestTimestamp: 1_689_865_053,
  visualizationConfig: {
    colors: {
      newest: "#f0abfc",
      oldest: "#581c87",
      notLoaded: "#232323",
    },
    style: {
      lineLength: "lineLength",
    },
  },
  lineLengthMax: 120,
  isPreview: false,
  selectedStartDate: new GizDate().subtractDays(365),
  selectedEndDate: new GizDate(),
  redrawCount: 0,
  coloringMode: "age",
  dpr: 10,
  rect: {
    x: 1075,
    y: 201,
    width: 300,
    height: 420,
    top: 201,
    right: 1375,
    bottom: 621,
    left: 1075,
  },
};
