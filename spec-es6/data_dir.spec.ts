import { describe, it, execute, expect } from "./mini_test.ts";

import { getPlatformAppDataDir } from "../src/services/data_dir.ts"



describe("data_dir.ts unit tests", () => {

  describe("#getPlatformAppDataDir", () => {

    type TestCaseGetPlatformAppDataDir = [
      description: string,
      fnValue: Parameters<typeof getPlatformAppDataDir>, 
      expectedValueFn: (val: ReturnType<typeof getPlatformAppDataDir>) => boolean
    ]
    const testCases: TestCaseGetPlatformAppDataDir[] = [

      [
        "w/ unsupported OS it should return 'null'",
        ["aix", undefined], 
        (val) => val === null 
      ],

      [
        "w/ win32 and no APPDATA set it should return 'null'",
        ["win32", undefined],
        (val) => val === null
      ],

      [
        "w/ win32 and set APPDATA it should return set 'APPDATA'",
        ["win32", "AppData"],
        (val) => val === "AppData"
      ],

      [
        "w/ linux it should return '/.local/share'",
        ["linux", undefined],
        (val) => val !== null && val.endsWith("/.local/share")
      ],

      [
        "w/ linux and wrongly set APPDATA it should ignore APPDATA and return /.local/share",
        ["linux", "FakeAppData"],
        (val) => val !== null && val.endsWith("/.local/share")
      ],

      [
        "w/ darwin it should return /Library/Application Support",
        ["darwin", undefined],
        (val) => val !== null && val.endsWith("/Library/Application Support")
      ],
    ];

      testCases.forEach(testCase => {
        const [testDescription, value, isExpected] = testCase;
        return it(testDescription, () => {
          const actual = getPlatformAppDataDir(...value);
          const result = isExpected(actual);
          expect(result).toBeTruthy()

        })
      })


  })

  describe("#getTriliumDataDir", () => {
    // TODO
  })

  describe("#getDataDirs", () => {
    // TODO
  })

});

execute()