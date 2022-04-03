import * as simpleSet from "./simpleSet";

describe("simpleSet", () => {
  describe("create()", () => {
    it("uses the same empty set", () => {
      expect(simpleSet.create() != null);
      expect(simpleSet.create()).toEqual(simpleSet.create());
    });
    it("works with an array", () => {
      const result = simpleSet.create([1, 2, 3, 4, 100]);
      expect(result).not.toEqual(simpleSet.create());
    });
  });
  describe("values()", () => {
    it("works", () => {
      const result = simpleSet.values(simpleSet.create([1, 2, 3, 4, 100]));
      expect(result).toEqual(
        expect.arrayContaining(["1", "2", "3", "4", "100"])
      );
      expect(result).toHaveLength(5);
      expect(simpleSet.values(simpleSet.create())).toEqual([]);
    });
  });
  const eg = simpleSet.create(["foo", "bar", "bizz", "bazz"]);
  describe("has()", () => {
    it("works", () => {
      for (const val of ["foo", "bar", "bizz", "bazz"]) {
        expect(simpleSet.has(eg, val)).toBeTruthy();
      }
      for (const val of ["foobar", "barfoo", "bizzbazz", "bazzbizz"]) {
        expect(simpleSet.has(eg, val)).toBeFalsy();
      }
    });
  });
  describe("size()", () => {
    it("works", () => {
      expect(simpleSet.size(eg)).toEqual(4);
    });
  });
  describe("add()", () => {
    it("works under a typical scenario", () => {
      const result = simpleSet.add(eg, "foobar", "barfoo");
      expect(result).not.toEqual(eg);
      expect(simpleSet.size(result)).not.toEqual(simpleSet.size(eg));
      expect(simpleSet.values(result)).toHaveLength(6);
      expect(simpleSet.values(result)).toEqual(
        expect.arrayContaining([
          "foo",
          "bar",
          "bizz",
          "bazz",
          "foobar",
          "barfoo",
        ])
      );
    });
    it("doesn't touch when the values are already present", () => {
      let result = simpleSet.add(eg, "foo", "bar");
      expect(result).toBe(eg);
      result = simpleSet.add(eg, "foo", "foobar");
      expect(result).not.toBe(eg);
      expect(simpleSet.size(result)).toEqual(simpleSet.size(eg) + 1);
    });
  });
  describe("remove()", () => {
    it("works typically", () => {
      const result = simpleSet.remove(eg, "foo", "bar");
      expect(result).toEqual(simpleSet.create(["bizz", "bazz"]));
    });
    it("doesn't touch it when the values aren't present", () => {
      const result = simpleSet.remove(eg, "foobar");
      expect(result).toBe(eg);
      const result2 = simpleSet.remove(eg, "foo", "foobar");
      expect(result2).toEqual(simpleSet.remove(eg, "foo"));
    });
  });
  describe("union()", () => {
    it("works", () => {
      expect(
        simpleSet.union(
          simpleSet.create(["foo", "bar"]),
          simpleSet.create(["bizz", "bazz"])
        )
      ).toEqual(eg);
    });
    it("works if there's overlap", () => {
      expect(
        simpleSet.union(
          simpleSet.create(["foo", "bar", "bizz"]),
          simpleSet.create(["bizz", "bazz"])
        )
      ).toEqual(eg);
    });
  });
  describe("difference()", () => {
    it("works", () => {
      expect(
        simpleSet.difference(eg, simpleSet.create(["bizz", "bazz", "foobar"]))
      ).toEqual(simpleSet.create(["foo", "bar"]));
    });
  });
  describe("intersection()", () => {
    it("works", () => {
      expect(
        simpleSet.insersection(
          simpleSet.create(["foo", "foobar"]),
          simpleSet.create(["bar", "foobar"])
        )
      ).toEqual(simpleSet.create(["foobar"]));
    });
  });
  describe("overlaps()", () => {
    it("works", () => {
      expect(
        simpleSet.overlaps(
          simpleSet.create(["foo", "foobar"]),
          simpleSet.create(["bar", "foobar"])
        )
      ).toBeTruthy();
    });
  });
});
