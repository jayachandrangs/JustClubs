const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

test('court CSV parser accepts TeamName as the appended eighth field', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'DynamicCourts.js'), 'utf8');
  assert.match(source, /TeamName:\s*\(columns\[7\]\s*\|\|\s*''\)\.toLowerCase\(\)/);
});
