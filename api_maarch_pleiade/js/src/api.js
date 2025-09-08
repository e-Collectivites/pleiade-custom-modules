// FILE: api.js

export class EmailAPIService {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
  }

  async fetchData() {
    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("API Fetch Error:", error);
      throw error;  // Re-throw to be handled by the calling component
    }
  }
}