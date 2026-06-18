export class DashboardPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
        this.profileTrigger = page.locator('header div.relative [title="User Profile"]');
        this.signOutButton = page.locator('button:has-text("Sign out")');
        this.sidebarLinks = page.locator('aside nav a');
    }

    /**
     * @param {string} name
     */
    async clickSidebarLink(name) {
        const link = this.page.locator(`aside nav a:has-text("${name}")`);
        await link.click();
    }

    async logout() {
        await this.profileTrigger.click();
        await this.signOutButton.click();
        await this.page.waitForURL('**/login');
    }

    async getHeaderTitle() {
        return await this.page.locator('h1').textContent();
    }
}
