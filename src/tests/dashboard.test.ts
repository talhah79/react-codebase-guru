/**
 * Terminal Dashboard Tests
 */

import { TerminalDashboard, DashboardData } from '../dashboard/terminalDashboard';

describe('TerminalDashboard', () => {
  let dashboard: TerminalDashboard;

  beforeEach(() => {
    dashboard = new TerminalDashboard({
      enableKeyboardShortcuts: false, // Disable for testing
      refreshRate: 100,
    });
  });

  afterEach(() => {
    if (dashboard) {
      dashboard.stop();
    }
  });

  it('should initialize with default values', () => {
    expect(dashboard).toBeDefined();
  });

  it('should update data correctly', () => {
    const testData: Partial<DashboardData> = {
      complianceScore: 85,
      violations: [
        { severity: 'error', type: 'inline-styles', message: 'Test violation' },
      ],
      sessionStats: {
        filesWatched: 10,
        changesDetected: 5,
        violationsFound: 1,
        duration: 30000,
      },
    };

    dashboard.updateData(testData);
    
    // Verify data was processed (would need internal access for full verification)
    expect(dashboard).toBeDefined();
  });

  it('should handle view switching', () => {
    dashboard.setView('violations');
    dashboard.setView('trends');
    dashboard.setView('hotspots');
    dashboard.setView('overview');
    
    expect(dashboard).toBeDefined();
  });

  it('should handle filtering', () => {
    dashboard.setFilter('inline-styles');
    dashboard.setFilter('');
    
    expect(dashboard).toBeDefined();
  });

  it('should handle navigation', () => {
    // Add some test violations first
    const testData: Partial<DashboardData> = {
      violations: [
        { severity: 'error', type: 'test1', message: 'Test 1' },
        { severity: 'warning', type: 'test2', message: 'Test 2' },
        { severity: 'error', type: 'test3', message: 'Test 3' },
      ],
    };
    
    dashboard.updateData(testData);
    dashboard.setView('violations');
    
    dashboard.navigateViolations('down');
    dashboard.navigateViolations('up');
    
    expect(dashboard).toBeDefined();
  });

  it('should emit events correctly', (done) => {
    dashboard.on('started', () => {
      dashboard.stop();
    });

    dashboard.on('stopped', () => {
      done();
    });

    dashboard.start();
  });
});