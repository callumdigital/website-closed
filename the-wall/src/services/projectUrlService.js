// Project URL mapping service
export const projectUrlService = {
  // Map project IDs to display names and URLs
  getProjectInfo(projectId) {
    // Default projects for demo purposes
    const defaultProjects = {
      'demo': {
        id: 'demo',
        name: 'Demo Project',
        description: 'A sample project for testing',
        url: 'demo',
        displayUrl: 'demo/display'
      },
      'workshop-2024': {
        id: 'workshop-2024',
        name: 'Design Workshop 2024',
        description: 'Annual design workshop feedback',
        url: 'workshop-2024',
        displayUrl: 'workshop-2024/display'
      },
      'feedback-session': {
        id: 'feedback-session',
        name: 'Product Feedback Session',
        description: 'User feedback collection',
        url: 'feedback-session',
        displayUrl: 'feedback-session/display'
      },
      'team-retro': {
        id: 'team-retro',
        name: 'Team Retrospective',
        description: 'Team retrospective notes',
        url: 'team-retro',
        displayUrl: 'team-retro/display'
      }
    }

    // Return default project if exists, otherwise create dynamic one
    return defaultProjects[projectId] || {
      id: projectId,
      name: this.formatProjectName(projectId),
      description: 'Custom project',
      url: `${projectId}`,
      displayUrl: `${projectId}/display`,
      fullUrl: `callum.digital/the-wall/${projectId}`
    }
  },

  // Format project name from URL slug
  formatProjectName(projectId) {
    return projectId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  },

  // Generate URL slug from project name
  generateUrlSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  },

  // Get all available projects
  getAllProjects() {
    return [
      this.getProjectInfo('demo'),
      this.getProjectInfo('workshop-2024'),
      this.getProjectInfo('feedback-session'),
      this.getProjectInfo('team-retro')
    ]
  },

  // Validate if a project ID exists
  isValidProject(projectId) {
    const validProjects = ['demo', 'workshop-2024', 'feedback-session', 'team-retro']
    return validProjects.includes(projectId)
  }
}
