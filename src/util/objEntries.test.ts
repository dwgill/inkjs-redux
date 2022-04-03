import { objEntries } from "./objEntries";

Object.defineProperty(Object, "entries", { value: "foobar" });

describe("objEntries", () => {
  it("test override works", () => {
    expect(typeof Object.entries).not.toEqual("function");
  });
  it("works", () => {
    const result = objEntries({
      foo: "bar",
      bar: "foo",
      foobar: "barfoo",
      barfoo: "foobar",
    });
    expect(result).toEqual(
      expect.arrayContaining([
        ["foo", "bar"],
        ["foobar", "barfoo"],
        ["bar", "foo"],
        ["barfoo", "foobar"],
      ])
    );
    expect(result).toHaveLength(4);
  });
});
