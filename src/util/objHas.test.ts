import { objHas } from "./objHas";

describe("objHas()", () => {
  it("works", () => {
    expect(
      objHas(
        {
          foo: 1,
        },
        "foo"
      )
    ).toBeTruthy();
  });

  it("doesn't fall for builtin methods", () => {
    expect(objHas({}, "toString")).toBeFalsy();
  });
});
