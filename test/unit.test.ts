import { parse } from "../src";

test("simple positive", () => {
  const entities = ["A", "B"];
  const result = parse("A&B", (i: string) => {
    return entities.includes(i);
  });

  expect(result).toBe(true);
});

test("simple negative", () => {
  const entities = ["A", "C"];
  const result = parse("A&B", (i: string) => {
    return entities.includes(i);
  });

  expect(result).toBe(false);
});

test("medium positive", () => {
  const entities = ["A", "C", "E", "F", "G", "H"];
  const result = parse("A&B/(X/E)&(G&H)", (i: string) => {
    return entities.includes(i);
  });

  expect(result).toBe(true);
});

test("medium negative", () => {
  const entities = ["A", "C", "E", "F", "G", "H"];
  const result = parse("A&B/(X/Y)&(G&H)", (i: string) => {
    return entities.includes(i);
  });

  expect(result).toBe(true);
});
