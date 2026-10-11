// Tests for the decisions in check-live.mjs that can't be tried without a real
// domain: DNS records, certificates and redirects.
//   npm test   (or: node --test scripts/check-live.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateDns, evaluateCert, evaluateRedirect } from './check-live.mjs';

const base = { apex: 'example.com', www: 'www.example.com', primary: 'www.example.com' };
const statuses = (r) => r.map((x) => x.status);

test('Netlify DNS: nameservers at NS1, both names resolve', () => {
  const r = evaluateDns({ ...base, ns: ['dns1.p05.nsone.net', 'dns2.p05.nsone.net.'], apexA: ['3.33.186.135'], wwwA: ['3.33.186.135'] });
  assert.deepEqual(statuses(r), ['pass', 'pass', 'pass']);
});

test('Netlify DNS but the domain was never added to the site', () => {
  const r = evaluateDns({ ...base, ns: ['dns1.p05.nsone.net'] });
  assert.deepEqual(statuses(r), ['pass', 'fail', 'fail']);
});

test('GoDaddy DNS set up correctly', () => {
  const r = evaluateDns({ ...base, ns: ['ns57.domaincontrol.com', 'ns58.domaincontrol.com'], apexA: ['75.2.60.5'], wwwCname: ['suraj-prakash.netlify.app'] });
  assert.deepEqual(statuses(r), ['info', 'pass', 'pass']);
});

test("GoDaddy's parked record left next to Netlify's", () => {
  const r = evaluateDns({ ...base, ns: ['ns57.domaincontrol.com'], apexA: ['75.2.60.5', '76.223.105.230'], wwwCname: ['suraj-prakash.netlify.app'] });
  assert.equal(r[1].status, 'fail');
  assert.match(r[1].text, /76\.223\.105\.230/);
});

test('GoDaddy defaults untouched: parked A record, www → @', () => {
  const r = evaluateDns({ ...base, ns: ['ns57.domaincontrol.com'], apexA: ['76.223.105.230'], wwwCname: ['example.com'] });
  assert.deepEqual(statuses(r), ['info', 'fail', 'fail']);
});

test('Leftover IPv6 record fails', () => {
  const r = evaluateDns({ ...base, ns: ['ns57.domaincontrol.com'], apexA: ['75.2.60.5'], apexAAAA: ['2603:5:2::1'], wwwCname: ['x.netlify.app'] });
  assert.ok(r.some((x) => x.status === 'fail' && /AAAA/.test(x.text)));
});

test('Root domain as primary with GoDaddy DNS gives a warning only', () => {
  const r = evaluateDns({ ...base, primary: 'example.com', ns: ['ns1.domaincontrol.com'], apexA: ['75.2.60.5'], wwwCname: ['x.netlify.app'] });
  assert.deepEqual(statuses(r), ['info', 'pass', 'pass', 'warn']);
});

test('CAA records that leave out Let\'s Encrypt fail', () => {
  const r = evaluateDns({ ...base, ns: ['dns1.p05.nsone.net'], apexA: ['1.2.3.4'], wwwA: ['1.2.3.4'], caa: [{ critical: 0, issue: 'digicert.com' }] });
  assert.equal(r.at(-1).status, 'fail');
  const ok = evaluateDns({ ...base, ns: ['dns1.p05.nsone.net'], apexA: ['1.2.3.4'], wwwA: ['1.2.3.4'], caa: [{ critical: 0, issue: 'letsencrypt.org' }] });
  assert.equal(ok.at(-1).status, 'pass');
});

const now = new Date('2026-10-11T00:00:00Z');
const cert = { host: 'www.example.com', authorized: true, hostError: false, issuer: "Let's Encrypt R11", protocol: 'TLSv1.3', validTo: new Date('2026-12-30T00:00:00Z') };

test('A valid certificate passes', () => assert.equal(evaluateCert(cert, now).status, 'pass'));
test('A certificate for *.netlify.app on the custom domain fails', () => assert.equal(evaluateCert({ ...cert, hostError: true, subject: '*.netlify.app' }, now).status, 'fail'));
test('No HTTPS at all fails', () => assert.equal(evaluateCert({ host: 'x', error: 'ECONNREFUSED' }, now).status, 'fail'));
test('Close to expiry warns', () => assert.equal(evaluateCert({ ...cert, validTo: new Date('2026-10-20T00:00:00Z') }, now).status, 'warn'));
test('Expired fails', () => assert.equal(evaluateCert({ ...cert, validTo: new Date('2026-10-01T00:00:00Z') }, now).status, 'fail'));
test('Untrusted chain fails', () => assert.equal(evaluateCert({ ...cert, authorized: false, authError: 'SELF_SIGNED_CERT_IN_CHAIN' }, now).status, 'fail'));

const home = 'https://www.example.com/';
test('http → https → www in permanent steps passes', () => {
  const r = evaluateRedirect('http://example.com/', [{ url: 'http://example.com/', status: 301 }, { url: 'https://example.com/', status: 301 }, { url: home, status: 200 }], home);
  assert.equal(r.status, 'pass');
});
test('A temporary redirect warns', () => {
  const r = evaluateRedirect('https://example.com/', [{ url: 'https://example.com/', status: 302 }, { url: home, status: 200 }], home);
  assert.equal(r.status, 'warn');
});
test('Ending on the wrong address fails', () => {
  const r = evaluateRedirect('http://example.com/', [{ url: 'http://example.com/', status: 200 }], home);
  assert.equal(r.status, 'fail');
});
test('A connection error fails', () => {
  const r = evaluateRedirect('https://example.com/', [{ url: 'https://example.com/', error: 'ERR_TLS_CERT_ALTNAME_INVALID' }], home);
  assert.equal(r.status, 'fail');
});
