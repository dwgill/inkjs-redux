import * as simpleMap from "./simpleMap";

describe("simpleMap", () => {
  describe("create", () => {
    it("works with no arguments", () => {
      expect(() => {
        simpleMap.create();
      }).not.toThrow();
      const result = simpleMap.create();
      expect(result).not.toBeUndefined();
      expect(result).not.toBeNull();
      expect(result).toEqual(simpleMap.create());
      expect(result).not.toEqual(simpleMap.create([["foo", "bar"]]));
    });
    it("works with arguments", () => {
      expect(() => {
        simpleMap.create([["foo", "bar"]]);
      }).not.toThrow();
    });
    it("sets the size correctly when accepting multiple values", () => {
      expect(
        simpleMap.create([
          ["foo", "bar"],
          ["foo", "bar"],
        ]).size
      ).toEqual(1);
    });
    it("re-uses the same empty map", () => {
      expect(simpleMap.create()).toBe(simpleMap.create());
    });
  });
  describe("size", () => {
    it("accurately captures the size of the map", () => {
      expect(simpleMap.size(simpleMap.create())).toEqual(0);
      expect(simpleMap.size(simpleMap.create([["foo", "bar"]]))).toEqual(1);
      expect(
        simpleMap.size(
          simpleMap.create([
            ["foo1", "bar1"],
            ["foo2", "bar2"],
          ])
        )
      ).toEqual(2);
    });
    it("handles null or undefined like an empty map", () => {
      expect(simpleMap.size(null)).toEqual(0);
      expect(simpleMap.size(undefined)).toEqual(0);
    });
  });
  const example = simpleMap.create<string | number>([
    ["foo", "bar"],
    ["bar", "foo"],
    ["foo1", 1],
    ["foo2", 2],
  ]);
  describe("has", () => {
    it("reports what keys are present in the map", () => {
      for (const key of ["foo", "bar", "foo1", "foo2"]) {
        expect(simpleMap.has(example, key)).toBeTruthy();
      }
    });
    it("reports what keys are absent from the map", () => {
      for (const key of ["bizz", "bazz", "foo3", "foo4"]) {
        expect(simpleMap.has(example, key)).toBeFalsy();
      }
    });
    it("doesn't report the map as containing common object methods", () => {
      expect(simpleMap.has(example, "toString")).toBeFalsy();
      expect("toString" in example.entries).toBeTruthy();
    });
  });
  describe("set", () => {
    it("creates a new object and does not mutate the old one", () => {
      const example1Clone: typeof example = JSON.parse(
        JSON.stringify(example)
      );
      const result = simpleMap.set(example, "foobar", 10);
      expect(result).not.toBe(example);
      expect(example).not.toBe(example1Clone);
      expect(example).toEqual(example1Clone);
    });
    it("can be used to add an entry to a map", () => {
      const result = simpleMap.set(example, "foobar", 10);
      expect(result).not.toEqual(example);
      expect(simpleMap.size(result)).toEqual(simpleMap.size(example) + 1);
      expect(simpleMap.has(result, "foobar")).toBeTruthy();
      expect(simpleMap.has(example, "foobar")).toBeFalsy();
    });
    it("doesn't update the map if the value is identical to an existing entry", () => {
      const result = simpleMap.set(example, "foo", 'bar');
      expect(result).toEqual(example);
    });
    it("can be used to remove an entry by setting it to undefined", () => {
      const result = simpleMap.set(example, "foo", undefined);
      expect(result).not.toEqual(example);
      expect(simpleMap.size(result)).toEqual(simpleMap.size(example) - 1);
    });
  });
  describe("get", () => {
    it("correctly returns the right value for entries that exist in the map", () => {
      expect(simpleMap.get(example, "foo")).toEqual("bar");
      expect(simpleMap.get(example, "bar")).toEqual("foo");
      expect(simpleMap.get(example, "foo1")).toEqual(1);
      expect(simpleMap.get(example, "foo2")).toEqual(2);
    });
    it("returns undefined for non-existant entries", () => {
      expect(simpleMap.get(example, "bizz")).toEqual(undefined);
      expect(simpleMap.get(example, "bazz")).toEqual(undefined);
    });
  });
  describe("setMany", () => {
    it("works with one entry", () => {
      const result = simpleMap.setMany(example, [["foobar", 100]]);
      expect(result).not.toEqual(example);
      expect(simpleMap.has(result, "foobar"));
      expect(simpleMap.get(result, "foobar")).toEqual(100);
    });
    it("handles 2+ entries", () => {
      const result = simpleMap.setMany(example, [
        ["foobar", 100],
        ["barfoo", -100],
      ]);

      expect(result).not.toEqual(example);
      expect(simpleMap.has(result, "foobar")).toBeTruthy();
      expect(simpleMap.get(result, "foobar")).toEqual(100);
      expect(simpleMap.get(result, "barfoo")).toEqual(-100);
    });
    it("removes entries w/undefined values", () => {
      const result = simpleMap.setMany(example, [
        ["foobar", 100],
        ["foo", undefined],
      ]);
      expect(simpleMap.has(result, "foobar")).toBeTruthy();
      expect(simpleMap.get(result, "foobar")).toEqual(100);
      expect(simpleMap.has(result, "foo")).toBeFalsy();
      expect(simpleMap.get(result, "foo")).toEqual(undefined);
    });
  });
  describe("remove", () => {
    it("works in the typcial case", () => {
      const result = simpleMap.remove(example, "foo", "bar");
      expect(simpleMap.has(example, "foo")).toBeTruthy();
      expect(simpleMap.has(example, "bar")).toBeTruthy();
      expect(simpleMap.has(result, "foo")).toBeFalsy();
      expect(simpleMap.has(result, "bar")).toBeFalsy();
    });
    it("doesn't touch a map that already doesn't contain the entries", () => {
      const result = simpleMap.remove(example, "foobar");
      expect(result).toBe(example);
    });
  });
  describe("replace", () => {
    it("works w/defined entry and defined output", () => {
      const result = simpleMap.replace(
        example,
        "foo",
        (value) => value + "bar"
      );
      expect(result).not.toEqual(example);
      expect(simpleMap.get(result, "foo")).toEqual("barbar");
    });
    it("works w/undefined entry and defined output", () => {
      const result = simpleMap.replace(example, 'foobar', (val) => {
        expect(val).toEqual(undefined);
        return 10;
      });
      expect(simpleMap.has(result, 'foobar')).toBeTruthy();
      expect(simpleMap.get(result, 'foobar')).toEqual(10);
    });
    it("works w/defined entry and undefined output", () => {
      const result = simpleMap.replace(example, 'foo', () => undefined);
      expect(simpleMap.has(result, 'foo')).toBeFalsy();
    });
    it("works w/defined entry and undefined output", () => {
      const result = simpleMap.replace(example, 'foobar', () => undefined);
      expect(result).toBe(example);
    });
  });
  describe("entries", () => {
    const result = simpleMap.entries(example);
    expect(result).toHaveLength(4);
    expect(result).toEqual(
      expect.arrayContaining([
        ["foo", "bar"],
        ["bar", "foo"],
        ["foo1", 1],
        ["foo2", 2],
      ])
    );
  });
});
