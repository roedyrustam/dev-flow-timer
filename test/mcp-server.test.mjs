import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';

const testStatePath = path.join(os.tmpdir(), `devflow-test-mcp-${Date.now()}-${Math.random().toString(36).substring(2)}.json`);
process.env.DEVFLOW_STATE_FILE = testStatePath;

const {
  TOOLS,
  MCP_RESOURCES,
  handleRpcRequest
} = await import('../bin/mcp-server.mjs');

const { clearStateForTesting } = await import('../lib/timer-engine.mjs');

test('DevFlow MCP Server RPC Test Suite', async (t) => {
  t.beforeEach(() => {
    clearStateForTesting();
  });

  t.after(() => {
    clearStateForTesting();
  });

  await t.test('initialize returns protocol capabilities', async () => {
    const res = await handleRpcRequest({
      id: 1,
      method: 'initialize',
      params: {}
    });

    assert.equal(res.id, 1);
    assert.equal(res.result.serverInfo.name, 'devflow-timer-mcp');
    assert.ok(res.result.capabilities.tools);
  });

  await t.test('tools/list returns 15 registered tools', async () => {
    const res = await handleRpcRequest({
      id: 2,
      method: 'tools/list',
      params: {}
    });

    assert.equal(res.id, 2);
    assert.ok(Array.isArray(res.result.tools));
    assert.equal(res.result.tools.length, 15);

    const toolNames = res.result.tools.map(t => t.name);
    assert.ok(toolNames.includes('devflow_start_timer'));
    assert.ok(toolNames.includes('devflow_get_status'));
    assert.ok(toolNames.includes('devflow_export_history'));
  });

  await t.test('tools/call handles devflow_start_timer and devflow_get_status', async () => {
    const startRes = await handleRpcRequest({
      id: 3,
      method: 'tools/call',
      params: {
        name: 'devflow_start_timer',
        arguments: {
          type: 'coding',
          duration_minutes: 25,
          task: 'MCP Test Sprint',
          tag: 'test'
        }
      }
    });

    assert.equal(startRes.id, 3);
    const startData = JSON.parse(startRes.result.content[0].text);
    assert.equal(startData.active, true);
    assert.equal(startData.task, 'MCP Test Sprint');

    const statusRes = await handleRpcRequest({
      id: 4,
      method: 'tools/call',
      params: {
        name: 'devflow_get_status',
        arguments: {}
      }
    });

    const statusData = JSON.parse(statusRes.result.content[0].text);
    assert.equal(statusData.active, true);
    assert.equal(statusData.task, 'MCP Test Sprint');
  });

  await t.test('tools/call handles devflow_export_history in json and csv formats', async () => {
    const jsonRes = await handleRpcRequest({
      id: 5,
      method: 'tools/call',
      params: {
        name: 'devflow_export_history',
        arguments: { format: 'json' }
      }
    });

    assert.equal(jsonRes.id, 5);
    const rawJson = jsonRes.result.content[0].text;
    assert.doesNotThrow(() => JSON.parse(rawJson));

    const csvRes = await handleRpcRequest({
      id: 6,
      method: 'tools/call',
      params: {
        name: 'devflow_export_history',
        arguments: { format: 'csv' }
      }
    });

    const rawCsv = csvRes.result.content[0].text;
    assert.ok(rawCsv.includes('session_id,date,type,task'));
  });
});
