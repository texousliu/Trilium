import { describe, it, expect } from "vitest";
import importUtils from "./utils.js";


describe("#extractHtmlTitle", () => {

  const htmlWithNotTitle = `
  <html>
    <body>
      <div>abc</div>
    </body>
  </html>`;

  const htmlWithTitle = `
  <html><head>
    <title>Test Title</title>
  </head>
  <body>
    <div>abc</div>
  </body>
  </html>`;


  const htmlWithTitleWOpeningBracket = `
  <html><head>
  <title>Test < Title</title>
  </head>
  <body>
    <div>abc</div>
  </body>
  </html>`;

  type TestCaseExtractHtmlTitle = [htmlContent: string, expected: string | null, description: string];

  const testCases: TestCaseExtractHtmlTitle[] = [
    [htmlWithTitle, "Test Title", "with existing <title> tag"],
    [htmlWithTitleWOpeningBracket, null, "with existing <title> tag, that includes '<'"],
    [htmlWithNotTitle, null, "without existing <title> tag"],
    ["", null, "with empty content"]
  ];

    testCases.forEach((testCase) => {
        return it(`${(testCase[2])}, it should return '${testCase[1]}'`, () => {
            const [value, expected] = testCase;
            const actual = importUtils.extractHtmlTitle(value);
            expect(actual).toStrictEqual(expected);
        });
    });
})

describe.todo("#handleH1", () => {
  //TODO
})
