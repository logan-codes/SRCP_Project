export class ProjectPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
        this.searchInput = page.locator('input[placeholder*="Search by"]');
        this.activeProjectsTab = page.locator('button:has-text("Active Projects")');
        this.projectIdeasTab = page.locator('button:has-text("Project Ideas")');
        this.projectCards = page.locator('div.grid > div');
    }

    /**
     * @param {string} text
     */
    async search(text) {
        await this.searchInput.fill(text);
        await this.page.waitForTimeout(500); // Debounce / filter wait
    }

    async clickProjectDetails(index = 0) {
        const card = this.projectCards.nth(index);
        const detailsButton = card.locator('button:has-text("Details")');
        await detailsButton.click();
    }
}
