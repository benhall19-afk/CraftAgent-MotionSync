/**
 * Motion API Client
 */

import https from 'https';
import { config } from './config.js';

export class MotionAPI {
  constructor() {
    this.apiKey = config.motion.apiKey;
    this.baseUrl = 'api.usemotion.com';
  }

  /**
   * Make HTTP request to Motion API
   */
  async request(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseUrl,
        path: path,
        method: method,
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(responseData));
            } catch (e) {
              resolve(responseData);
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  /**
   * Get all workspaces
   */
  async getWorkspaces() {
    const result = await this.request('GET', '/v1/workspaces');
    return result.workspaces;
  }

  /**
   * Get all tasks from a workspace
   */
  async getTasks(workspaceId) {
    const result = await this.request('GET', `/v1/tasks?workspaceId=${workspaceId}`);
    return result.tasks || [];
  }

  /**
   * Get a specific task
   */
  async getTask(taskId) {
    return await this.request('GET', `/v1/tasks/${taskId}`);
  }

  /**
   * Create a new task
   */
  async createTask(taskData) {
    return await this.request('POST', '/v1/tasks', taskData);
  }

  /**
   * Update a task
   */
  async updateTask(taskId, updates) {
    return await this.request('PATCH', `/v1/tasks/${taskId}`, updates);
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId) {
    return await this.request('DELETE', `/v1/tasks/${taskId}`);
  }

  /**
   * Get all projects from a workspace
   */
  async getProjects(workspaceId) {
    const result = await this.request('GET', `/v1/projects?workspaceId=${workspaceId}`);
    return result.projects || [];
  }

  /**
   * Create a new project
   */
  async createProject(projectData) {
    return await this.request('POST', '/v1/projects', projectData);
  }

  /**
   * Update a project
   */
  async updateProject(projectId, updates) {
    return await this.request('PATCH', `/v1/projects/${projectId}`, updates);
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId) {
    return await this.request('DELETE', `/v1/projects/${projectId}`);
  }
}
