import type { WorkflowState, VisibilityReport, ProcessingStats } from '../types';

class ApiClientService {
  private baseUrl = '/api/module-4';

  /**
   * Start the visibility workflow
   */
  async startWorkflow(mode: 'manual' | 'automatic'): Promise<{
    success: boolean;
    message: string;
    state?: WorkflowState;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/start-workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start workflow');
      }

      return await response.json();
    } catch (error) {
      console.error('Error starting workflow:', error);
      throw error;
    }
  }

  /**
   * Stop the workflow
   */
  async stopWorkflow(): Promise<{
    success: boolean;
    message: string;
    finalState?: any;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/stop-workflow`, {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to stop workflow');
      }

      return await response.json();
    } catch (error) {
      console.error('Error stopping workflow:', error);
      throw error;
    }
  }

  /**
   * Get workflow status and statistics
   */
  async getWorkflowStatus(): Promise<{
    success: boolean;
    workflow: WorkflowState;
    statistics: ProcessingStats;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/status`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting status:', error);
      throw error;
    }
  }

  /**
   * Process next case in manual mode
   */
  async processNextCase(): Promise<{
    success: boolean;
    message: string;
    completed: boolean;
    state?: WorkflowState;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/process-case`, {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process case');
      }

      return await response.json();
    } catch (error) {
      console.error('Error processing case:', error);
      throw error;
    }
  }

  /**
   * Get report data
   */
  async getReport(startDate?: Date, endDate?: Date): Promise<{
    success: boolean;
    data: VisibilityReport[];
    count: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/export-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get report');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting report:', error);
      throw error;
    }
  }

  /**
   * Export report as CSV
   */
  async exportReportCSV(startDate?: Date, endDate?: Date): Promise<void> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await fetch(`${this.baseUrl}/export-report?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to export report');
      }

      // Get the CSV content
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `visibility-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  }

  /**
   * Delete a report log entry
   */
  async deleteReport(logId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/delete-log`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete log entry');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  }
}

export const apiClient = new ApiClientService();