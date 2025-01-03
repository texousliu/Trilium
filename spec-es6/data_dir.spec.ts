import { describe, it, execute, expect } from "./mini_test.ts";

import { getPlatformAppDataDir, getDataDirs} from "../src/services/data_dir.ts"



describe("data_dir.ts unit tests", () => {

  describe("#getPlatformAppDataDir()", () => {

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

  describe("#getDataDirs()", () => {

    const envKeys: Omit<keyof ReturnType<typeof getDataDirs>, "TRILIUM_DATA_DIR">[] = [
      "DOCUMENT_PATH",
      "BACKUP_DIR",
      "LOG_DIR",
      "ANONYMIZED_DB_DIR",
      "CONFIG_INI_PATH",
    ];

    const setMockedEnv = (prefix: string | null) => {
      envKeys.forEach(key => {
        if (prefix) {
          process.env[`TRILIUM_${key}`] = `${prefix}_${key}`
        } else {
          delete process.env[`TRILIUM_${key}`]
        }
      })
    };

    it("w/ process.env values present, it should return an object using values from process.env", () => {

      // set mocked values
      const mockValuePrefix = "MOCK";
      setMockedEnv(mockValuePrefix);

      // get result
      const result = getDataDirs(`${mockValuePrefix}_TRILIUM_DATA_DIR`);

      for (const key in result) {
        expect(result[key]).toEqual(`${mockValuePrefix}_${key}`)
      }
    })

    it("w/ NO process.env values present, it should return an object using supplied TRILIUM_DATA_DIR as base", () => {

      // make sure values are undefined
      setMockedEnv(null);

      const mockDataDir = "/home/test/MOCK_TRILIUM_DATA_DIR"
      const result = getDataDirs(mockDataDir);

      for (const key in result) {
        expect(result[key].startsWith(mockDataDir)).toBeTruthy()
      }
    })

    it("should ignore attempts to change a property on the returned object", () => {

      // make sure values are undefined
      setMockedEnv(null);

      const mockDataDir = "/home/test/MOCK_TRILIUM_DATA_DIR"
      const result = getDataDirs(mockDataDir);

      //@ts-expect-error - attempt to change value of readonly property
      result.BACKUP_DIR = "attempt to change";

      for (const key in result) {
        expect(result[key].startsWith(mockDataDir)).toBeTruthy()
      }
    })
  })

});

execute()