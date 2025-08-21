/**
 * Analysis Streaming Tests
 */

import { AnalysisStream } from '../streaming/analysisStream';
import { AnalysisChange } from '../performance/incrementalAnalyzer';
import { DriftAnalysisResult } from '../drift-detector/driftAnalyzer';
import { ComponentInfo } from '../types';
import * as path from 'path';
import * as os from 'os';

describe('AnalysisStream', () => {
  let stream: AnalysisStream;
  const testProjectPath = path.join(os.tmpdir(), 'test-guru-project');

  beforeEach(() => {
    stream = new AnalysisStream({
      projectPath: testProjectPath,
      enableRealTimeReports: false, // Disable for testing
      enableMetrics: true,
    });
  });

  afterEach(() => {
    if (stream) {
      stream.stop();
    }
  });

  it('should initialize with default values', () => {
    expect(stream).toBeDefined();
    expect(stream.getCurrentMetrics().score).toBe(100);
    expect(stream.getEventStream()).toHaveLength(0);
  });

  it('should start and stop streaming', (done) => {
    stream.on('stream-started', () => {
      stream.stop();
    });

    stream.on('stream-stopped', () => {
      done();
    });

    stream.start();
  });

  it('should process file changes', () => {
    stream.start();

    const changes: AnalysisChange[] = [
      {
        type: 'modified',
        filePath: '/test/file.tsx',
        result: {
          filePath: '/test/file.tsx',
          name: 'TestComponent',
          type: 'functional',
          hasJSX: true,
          props: [],
          dependencies: [],
          success: true,
        } as ComponentInfo,
      },
    ];

    stream.processChanges(changes);

    const events = stream.getEventStream();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('change-detected');
    expect(events[0].data.changeCount).toBe(1);
  });

  it('should process analysis results', () => {
    stream.start();

    const result: DriftAnalysisResult = {
      complianceScore: 85,
      violations: [
        { 
          severity: 'error' as const, 
          type: 'inline-styles', 
          message: 'Test violation',
          filePath: '/test/file.tsx',
        },
      ],
      summary: {
        total: 1,
        errors: 1,
        warnings: 0,
        byType: { 'inline-styles': 1 },
      },
    };

    stream.processAnalysisResult(result, 150);

    const metrics = stream.getCurrentMetrics();
    expect(metrics.score).toBe(85);
    expect(metrics.violationCount).toBe(1);
    expect(metrics.errorCount).toBe(1);
    expect(metrics.performanceMetrics.analysisTime).toBe(150);
  });

  it('should detect violation hotspots', () => {
    stream.start();

    // Process multiple violations for the same file
    const violations = [
      { severity: 'error' as const, filePath: '/test/hotspot.tsx', type: 'test1', message: 'Test 1', line: 1 },
      { severity: 'warning' as const, filePath: '/test/hotspot.tsx', type: 'test2', message: 'Test 2', line: 2 },
      { severity: 'error' as const, filePath: '/test/other.tsx', type: 'test3', message: 'Test 3', line: 1 },
    ];

    stream.processViolations(violations);

    const hotspots = stream.getViolationHotspots();
    expect(hotspots).toHaveLength(2);
    expect(hotspots[0].filePath).toBe('/test/hotspot.tsx');
    expect(hotspots[0].violationCount).toBe(2);
    expect(hotspots[0].severityBreakdown.error).toBe(1);
    expect(hotspots[0].severityBreakdown.warning).toBe(1);
  });

  it('should track metrics history', () => {
    stream.start();

    // Process multiple analysis results
    stream.processAnalysisResult({ 
      complianceScore: 90, 
      violations: [], 
      summary: { total: 0, errors: 0, warnings: 0, byType: {} } 
    }, 100);
    stream.processAnalysisResult({ 
      complianceScore: 85, 
      violations: [{ type: 'test', severity: 'error', filePath: '/test.tsx', message: 'Test' }], 
      summary: { total: 1, errors: 1, warnings: 0, byType: { 'test': 1 } } 
    }, 120);
    stream.processAnalysisResult({ 
      complianceScore: 80, 
      violations: [
        { type: 'test1', severity: 'error', filePath: '/test1.tsx', message: 'Test1' },
        { type: 'test2', severity: 'error', filePath: '/test2.tsx', message: 'Test2' },
      ], 
      summary: { total: 2, errors: 2, warnings: 0, byType: { 'test1': 1, 'test2': 1 } } 
    }, 110);

    const history = stream.getMetricsHistory();
    expect(history).toHaveLength(3);
    expect(history[0].score).toBe(90);
    expect(history[1].score).toBe(85);
    expect(history[2].score).toBe(80);
  });

  it('should export stream data', async () => {
    stream.start();

    // Add some test data
    stream.processChanges([{
      type: 'modified',
      filePath: '/test/file.tsx',
      result: {
        filePath: '/test/file.tsx',
        name: 'TestComponent',
        type: 'functional',
        hasJSX: true,
        props: [],
        dependencies: [],
        success: true,
      } as ComponentInfo,
    }]);

    const jsonData = await stream.exportStreamData('json');
    expect(jsonData).toContain('metadata');
    expect(jsonData).toContain('events');
    expect(jsonData).toContain('metrics');

    const csvData = await stream.exportStreamData('csv');
    expect(csvData).toContain('timestamp,score,violations');
  });

  it('should generate real-time reports', async () => {
    stream.start();

    // Add some test data
    stream.processAnalysisResult({
      complianceScore: 75,
      violations: [
        { severity: 'error' as const, type: 'test', message: 'Test violation', filePath: '/test.tsx' },
      ],
      summary: { total: 1, errors: 1, warnings: 0, byType: { 'test': 1 } },
    }, 200);

    const report = await stream.generateRealTimeReport();
    expect(report).toContain('Real-time Drift Analysis Report');
    expect(report).toContain('75.0%');
    expect(report).toContain('- **Total Violations**: 1');
    expect(report).toContain('Performance');
  });
});