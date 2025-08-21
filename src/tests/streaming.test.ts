/**
 * Analysis Streaming Tests
 */

import { AnalysisStream } from '../streaming/analysisStream';
import { AnalysisChange } from '../performance/incrementalAnalyzer';
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
        result: { success: true, name: 'TestComponent' },
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

    const result = {
      complianceScore: 85,
      violations: [
        { severity: 'error', type: 'inline-styles', message: 'Test violation' },
      ],
      summary: {
        errors: 1,
        warnings: 0,
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
      { severity: 'error', filePath: '/test/hotspot.tsx', type: 'test1', message: 'Test 1' },
      { severity: 'warning', filePath: '/test/hotspot.tsx', type: 'test2', message: 'Test 2' },
      { severity: 'error', filePath: '/test/other.tsx', type: 'test3', message: 'Test 3' },
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
    stream.processAnalysisResult({ complianceScore: 90, violations: [], summary: { errors: 0, warnings: 0 } }, 100);
    stream.processAnalysisResult({ complianceScore: 85, violations: [{}], summary: { errors: 1, warnings: 0 } }, 120);
    stream.processAnalysisResult({ complianceScore: 80, violations: [{}, {}], summary: { errors: 2, warnings: 0 } }, 110);

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
      result: { success: true },
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
        { severity: 'error', type: 'test', message: 'Test violation' },
      ],
      summary: { errors: 1, warnings: 0 },
    }, 200);

    const report = await stream.generateRealTimeReport();
    expect(report).toContain('Real-time Drift Analysis Report');
    expect(report).toContain('75.0%');
    expect(report).toContain('Total Violations: 1');
    expect(report).toContain('Performance');
  });
});